import {
  App,
  ItemView,
  MarkdownView,
  Menu,
  Modal,
  Notice,
  normalizePath,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  ViewStateResult,
  WorkspaceLeaf,
  editorInfoField,
  requestUrl,
} from 'obsidian';
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { encode } from 'plantuml-encoder';

const VIEW_TYPE_PUML = 'puml-viewer';
const encodePlantuml = encode;
const CSS_AUTO = 'auto';
const CSS_NONE = 'none';
const SUPPORTED_PLANTUML_EXTENSIONS = ['puml'] as const;
const SUPPORTED_MERMAID_EXTENSIONS = ['mermaid', 'mmd', 'marmaid'] as const;
const SUPPORTED_DIAGRAM_EXTENSIONS = [
  ...SUPPORTED_PLANTUML_EXTENSIONS,
  ...SUPPORTED_MERMAID_EXTENSIONS,
] as const;

type ViewMode = 'view' | 'edit' | 'split';

const DIAGRAM_SOURCE_EXTENSION = { plantuml: 'puml', mermaid: 'mmd' } as const;

function buildFencedCodeBlock(
  source: string,
  language: string,
  widthHintPx: number | null,
): string {
  const body = source.replace(/\n+$/, '');
  // Use a fence longer than any backtick fence inside the body.
  let fenceLength = 3;
  for (const match of body.matchAll(/^\s*(`{3,})/gm)) {
    fenceLength = Math.max(fenceLength, match[1].length + 1);
  }
  const fence = '`'.repeat(fenceLength);
  const hint = widthHintPx ? ` |${widthHintPx}` : '';
  return `${fence}${language}${hint}\n${body}\n${fence}`;
}

function sanitizeFileBaseName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|#^[\]]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '');
}
type DiagramFormat = 'svg' | 'png' | 'txt';
type DiagramType = 'plantuml' | 'mermaid';
type ExportConflictAction = 'overwrite' | 'new-file' | 'cancel';

interface PUMLViewerSettings {
  serverType: 'plantuml' | 'kroki' | 'local';
  plantumlServerUrl: string;
  krokiServerUrl: string;
  krokiDiagramType: DiagramType;
  localServerUrl: string;
  imageFormat: 'svg' | 'png';
  autoRefresh: boolean;
  lastOpenedPumlPath: string;
  embeddedDefaultView: 'diagram' | 'code';
  embeddedDiagramAlign: 'left' | 'center' | 'right';
  splitRatio: number;
  previewDelayMs: number;
  previewOnSaveOnly: boolean;
  editorWordWrap: boolean;
}

const DEFAULT_SETTINGS: PUMLViewerSettings = {
  serverType: 'plantuml',
  plantumlServerUrl: 'https://www.plantuml.com/plantuml',
  krokiServerUrl: 'https://kroki.io',
  krokiDiagramType: 'plantuml',
  localServerUrl: 'http://localhost:8000',
  imageFormat: 'svg',
  autoRefresh: true,
  lastOpenedPumlPath: '',
  embeddedDefaultView: 'diagram',
  embeddedDiagramAlign: 'center',
  splitRatio: 0.5,
  previewDelayMs: 800,
  previewOnSaveOnly: false,
  editorWordWrap: false,
};

const SPLIT_STACK_BREAKPOINT_PX = 700;
const SPLIT_RATIO_MIN = 0.15;
const SPLIT_RATIO_MAX = 0.85;

interface PUMLViewState extends Record<string, unknown> {
  file?: string;
  mode?: ViewMode;
}

function getDiagramTypeByExtension(extension: string): DiagramType | null {
  const normalized = extension.toLowerCase();
  if ((SUPPORTED_PLANTUML_EXTENSIONS as readonly string[]).includes(normalized)) return 'plantuml';
  if ((SUPPORTED_MERMAID_EXTENSIONS as readonly string[]).includes(normalized)) return 'mermaid';
  return null;
}

function parseSvgLength(value: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stripWidthHeightFromInlineStyle(styleValue: string): string {
  const chunks = styleValue
    .split(';')
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  const kept = chunks.filter((chunk) => {
    const colonIdx = chunk.indexOf(':');
    if (colonIdx <= 0) return true;
    const key = chunk.slice(0, colonIdx).trim().toLowerCase();
    return key !== 'width' && key !== 'height';
  });

  return kept.join('; ');
}

function normalizeSvgForResponsiveLayout(svgEl: SVGSVGElement): void {
  const viewBox = svgEl.getAttribute('viewBox')?.trim() ?? '';
  if (!viewBox) {
    const width = parseSvgLength(svgEl.getAttribute('width'));
    const height = parseSvgLength(svgEl.getAttribute('height'));
    if (width > 0 && height > 0) {
      svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
  }

  // PlantUML often emits preserveAspectRatio="none", which stretches the diagram.
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Fixed root dimensions can force stretching when CSS constrains only width.
  svgEl.removeAttribute('width');
  svgEl.removeAttribute('height');

  const styleAttr = svgEl.getAttribute('style');
  if (styleAttr) {
    const sanitizedStyle = stripWidthHeightFromInlineStyle(styleAttr);
    if (sanitizedStyle.length > 0) {
      svgEl.setAttribute('style', sanitizedStyle);
    } else {
      svgEl.removeAttribute('style');
    }
  }
}

function parseSvgMarkup(svgMarkup: string): SVGSVGElement | null {
  const parsed = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  if (parsed.querySelector('parsererror')) return null;
  const svgEl = parsed.querySelector('svg');
  if (!svgEl || svgEl.tagName.toLowerCase() !== 'svg') return null;

  // In Obsidian/Electron, cross-realm `instanceof SVGSVGElement` checks can fail.
  // Validate by tag name and return the imported node as an SVG root element.
  const imported = window.activeDocument.importNode(svgEl, true) as Element;
  if (imported.tagName.toLowerCase() !== 'svg') return null;
  const normalized = imported as SVGSVGElement;
  normalizeSvgForResponsiveLayout(normalized);
  return normalized;
}

export default class PUMLViewerPlugin extends Plugin {
  settings!: PUMLViewerSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_PUML, (leaf) => new PUMLViewerView(leaf, this));
    this.registerExtensions([...SUPPORTED_DIAGRAM_EXTENSIONS], VIEW_TYPE_PUML);

    this.addCommand({
      id: 'open-current-puml-in-viewer',
      name: 'Open current diagram file in viewer',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        const canOpen = !!file && getDiagramTypeByExtension(file.extension) !== null;

        if (canOpen && !checking && file) {
          void this.activatePUMLView(file);
        }

        return canOpen;
      },
    });

    this.app.workspace.onLayoutReady(() => {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile || getDiagramTypeByExtension(activeFile.extension) === null) return;

      const activeLeaf = this.app.workspace.getMostRecentLeaf();
      if (activeLeaf?.view.getViewType() === VIEW_TYPE_PUML) return;

      void this.activatePUMLView(activeFile);
    });

    for (const lang of ['plantuml', 'mermaid'] as const) {
      this.registerMarkdownCodeBlockProcessor(lang, async (source, el, ctx) => {
        const fenceWidthHintPx = this.extractFenceWidthHint(
          ctx.getSectionInfo(el)?.text ?? '',
          source,
          lang,
        );
        await this.renderEmbeddedDiagramBlock(source, el, fenceWidthHintPx, lang, ctx.sourcePath);
      });
    }

    // Live Preview renders ```mermaid natively (Obsidian hardcodes it before plugin
    // code block processors), so take over those widgets with the same embedded block.
    this.registerEditorExtension(this.createLivePreviewMermaidExtension());

    this.addSettingTab(new PUMLViewerSettingTab(this.app, this));
  }

  onunload(): void {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_PUML).forEach((leaf) => leaf.detach());
  }

  async loadSettings(): Promise<void> {
    const loaded = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as PUMLViewerSettings & {
      serverUrl?: string;
    };
    if (loaded.serverUrl) {
      if (loaded.serverType === 'kroki') {
        loaded.krokiServerUrl = loaded.serverUrl;
      } else if (loaded.serverType === 'local') {
        loaded.localServerUrl = loaded.serverUrl;
      } else {
        loaded.plantumlServerUrl = loaded.serverUrl;
      }
    }
    this.settings = loaded;
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  rerenderMarkdownPreviews(): void {
    const leaves = this.app.workspace.getLeavesOfType('markdown');
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof MarkdownView) {
        view.previewMode.rerender(true);
      }
    }
  }

  async rememberLastPuml(path: string): Promise<void> {
    if (!path || this.settings.lastOpenedPumlPath === path) return;
    this.settings.lastOpenedPumlPath = path;
    await this.saveSettings();
  }

  async activatePUMLView(file: TFile): Promise<void> {
    const leaf = this.app.workspace.getMostRecentLeaf() ?? this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: VIEW_TYPE_PUML,
      active: true,
      state: { file: file.path },
    });
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }

  buildRenderUrl(source: string, diagramType?: DiagramType): string {
    const useKroki = this.settings.serverType === 'kroki' || diagramType === 'mermaid';
    const normalizedBase = useKroki
      ? this.settings.krokiServerUrl.replace(/\/+$/, '').replace(/\/plantuml$/i, '')
      : this.getActiveServerUrl().replace(/\/+$/, '');
    const encoded = encodePlantuml(source);
    const format = this.settings.imageFormat;

    if (useKroki) {
      const resolvedDiagramType = diagramType ?? this.settings.krokiDiagramType;
      return `${normalizedBase}/${resolvedDiagramType}/${format}/${encoded}`;
    }

    return `${normalizedBase}/${format}/${encoded}`;
  }

  private normalizedServerBase(): string {
    let base = this.getActiveServerUrl().replace(/\/+$/, '');
    if (this.settings.serverType === 'kroki') {
      base = base.replace(/\/plantuml$/i, '');
    }
    return base;
  }

  private getActiveServerUrl(): string {
    if (this.settings.serverType === 'kroki') {
      return this.settings.krokiServerUrl;
    }
    if (this.settings.serverType === 'local') {
      return this.settings.localServerUrl;
    }
    return this.settings.plantumlServerUrl;
  }

  responseContentType(response: { headers?: Record<string, string> }): string {
    const headers = response.headers ?? {};
    return headers['content-type'] ?? headers['Content-Type'] ?? '';
  }

  async requestDiagram(source: string, format: DiagramFormat, diagramType?: DiagramType) {
    const useKroki = this.settings.serverType === 'kroki' || diagramType === 'mermaid';
    if (useKroki) {
      const normalizedBase = this.settings.krokiServerUrl
        .replace(/\/+$/, '')
        .replace(/\/plantuml$/i, '');
      const resolvedDiagramType = diagramType ?? this.settings.krokiDiagramType;
      const accept =
        format === 'svg' ? 'image/svg+xml' : format === 'png' ? 'image/png' : 'text/plain';
      return requestUrl({
        url: `${normalizedBase}/${resolvedDiagramType}/${format}`,
        method: 'POST',
        body: source,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          Accept: accept,
        },
        throw: false,
      });
    }

    const normalizedBase = this.normalizedServerBase();
    const encoded = encodePlantuml(source);
    return requestUrl({
      url: `${normalizedBase}/${format}/${encoded}`,
      method: 'GET',
      throw: false,
    });
  }

  async fetchPngObjectUrl(source: string, diagramType?: DiagramType): Promise<string> {
    const response = await this.requestDiagram(source, 'png', diagramType);
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = this.responseContentType(response);
    if (contentType && !contentType.includes('image/png')) {
      throw new Error(
        `Expected PNG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`,
      );
    }
    if (!response.arrayBuffer) {
      throw new Error('No PNG payload returned by render server');
    }

    const blob = new Blob([response.arrayBuffer], { type: 'image/png' });
    return URL.createObjectURL(blob);
  }

  async downloadDiagramAs(
    source: string,
    format: 'svg' | 'png',
    baseName = 'diagram',
    diagramType?: DiagramType,
  ): Promise<void> {
    const response = await this.requestDiagram(source, format, diagramType);
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    let blob: Blob;
    if (format === 'svg') {
      const contentType = this.responseContentType(response);
      if (contentType && !contentType.includes('image/svg')) {
        throw new Error(
          `Expected SVG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`,
        );
      }
      if (!response.text.includes('<svg')) {
        throw new Error('Response is not SVG content.');
      }
      blob = new Blob([response.text], { type: 'image/svg+xml' });
    } else {
      const contentType = this.responseContentType(response);
      if (contentType && !contentType.includes('image/png')) {
        throw new Error(
          `Expected PNG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`,
        );
      }
      if (!response.arrayBuffer) {
        throw new Error('No PNG payload returned by render server');
      }
      blob = new Blob([response.arrayBuffer], { type: 'image/png' });
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = window.activeDocument.body.createEl('a');
    link.href = objectUrl;
    link.download = `${baseName}.${format}`;
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  async downloadDiagram(
    source: string,
    baseName = 'diagram',
    diagramType?: DiagramType,
  ): Promise<void> {
    await this.downloadDiagramAs(source, this.settings.imageFormat, baseName, diagramType);
  }

  private async renderEmbeddedDiagramBlock(
    source: string,
    el: HTMLElement,
    fenceWidthHintPx: number | null,
    diagramType: DiagramType,
    sourcePath: string,
  ): Promise<void> {
    const diagramLabel = diagramType === 'mermaid' ? 'Mermaid' : 'PlantUML';
    const { renderSource, widthHintPx } = this.extractEmbeddedWidthHint(source, fenceWidthHintPx);

    const container = el.createDiv({ cls: 'puml-embed-block' });
    const actionsEl = container.createDiv({ cls: 'puml-embed-actions' });
    const toggleBtn = actionsEl.createEl('button', { cls: 'puml-embed-toggle' });
    const zoomBtn = actionsEl.createEl('button', { cls: 'puml-embed-zoom-btn', text: 'Zoom' });
    const saveBtn = actionsEl.createEl('button', { cls: 'puml-embed-save-btn', text: 'Save' });
    const copyBtn = actionsEl.createEl('button', { cls: 'puml-embed-copy-btn', text: 'Copy' });
    const copyBlockBtn = actionsEl.createEl('button', {
      cls: 'puml-embed-copy-btn',
      text: 'Copy block',
    });
    toggleBtn.setAttr('aria-label', 'Toggle code and diagram');
    zoomBtn.setAttr('aria-label', 'Open zoom overlay');
    saveBtn.setAttr('aria-label', 'Save image');
    copyBtn.setAttr('aria-label', 'Copy code');
    copyBlockBtn.setAttr('aria-label', `Copy as \`\`\`${diagramType} code block`);
    const diagramPane = container.createDiv({ cls: 'puml-embed-diagram' });
    if (widthHintPx) {
      diagramPane.addClass('puml-embed-diagram--constrained');
      diagramPane.style.setProperty('--puml-embed-max-width', `${widthHintPx}px`);
      diagramPane.addClass(`puml-embed-diagram--align-${this.settings.embeddedDiagramAlign}`);
    }
    const codePane = container.createEl('pre', { cls: 'puml-embed-code' });
    const codeEl = codePane.createEl('code', { cls: 'puml-embed-code-content' });
    const lines = source.split('\n');
    lines.forEach((line, index) => {
      const lineEl = codeEl.createSpan({ cls: 'puml-embed-code-line' });
      if (diagramType === 'plantuml') {
        this.renderPlantUmlHighlightedLine(lineEl, line);
      } else if (diagramType === 'mermaid') {
        this.renderMermaidHighlightedLine(lineEl, line);
      } else {
        lineEl.setText(line);
      }
      if (index < lines.length - 1) {
        lineEl.appendText('\n');
      }
    });
    codePane.hide();

    let showCode = this.settings.embeddedDefaultView === 'code';
    const applyToggleState = () => {
      if (showCode) {
        diagramPane.hide();
        codePane.show();
        toggleBtn.setText('Diagram');
        toggleBtn.setAttr('aria-label', 'Show diagram');
        zoomBtn.addClass('is-hidden');
        copyBtn.removeClass('is-hidden');
        copyBlockBtn.removeClass('is-hidden');
      } else {
        codePane.hide();
        diagramPane.show();
        toggleBtn.setText('Code');
        toggleBtn.setAttr('aria-label', 'Show code');
        zoomBtn.removeClass('is-hidden');
        copyBtn.addClass('is-hidden');
        copyBlockBtn.addClass('is-hidden');
      }
    };

    toggleBtn.addEventListener('click', () => {
      showCode = !showCode;
      applyToggleState();
    });
    applyToggleState();

    if (!renderSource.trim()) {
      diagramPane.createDiv({ cls: 'puml-embed-error', text: `${diagramLabel} block is empty.` });
      return;
    }

    const openZoomOverlay = async () => {
      const overlayEl = window.activeDocument.body.createDiv({ cls: 'puml-zoom-overlay' });

      const panelEl = overlayEl.createDiv({ cls: 'puml-zoom-panel' });

      const headerEl = panelEl.createDiv({ cls: 'puml-zoom-header' });

      headerEl.createDiv();

      const controlsEl = headerEl.createDiv({ cls: 'puml-zoom-controls' });

      const zoomOutBtn = controlsEl.createEl('button', { text: '-' });

      const zoomResetBtn = controlsEl.createEl('button', { text: '100%' });

      const zoomInBtn = controlsEl.createEl('button', { text: '+' });

      const closeBtn = headerEl.createEl('button', { cls: 'puml-zoom-close', text: 'Close' });

      const contentEl = panelEl.createDiv({ cls: 'puml-zoom-content' });

      const canvasEl = contentEl.createDiv({ cls: 'puml-zoom-canvas' });

      const loadingEl = canvasEl.createDiv({ cls: 'puml-loading', text: 'Generating diagram...' });

      let zoom = 1;
      let renderedEl: HTMLElement | SVGSVGElement | null = null;
      let baseWidth = 0;
      let centeredInitially = false;
      let isPanning = false;
      let panStartX = 0;
      let panStartY = 0;
      let panScrollLeft = 0;
      let panScrollTop = 0;
      const clampZoom = (value: number) => Math.min(8, Math.max(0.1, Math.round(value * 100) / 100));
      const applyZoom = () => {
        if (!renderedEl || baseWidth <= 0) return;
        renderedEl.style.maxWidth = CSS_NONE;
        renderedEl.style.width = `${Math.max(1, Math.round(baseWidth * zoom))}px`;
        renderedEl.style.height = CSS_AUTO;
      };
      const setZoom = (value: number) => {
        zoom = clampZoom(value);
        zoomResetBtn.textContent = `${Math.round(zoom * 100)}%`;
        applyZoom();
      };
      const fitToViewport = () => {
        if (!renderedEl || baseWidth <= 0) return;
        const available = Math.max(1, contentEl.clientWidth - 12);
        setZoom(Math.min(1, available / baseWidth));
      };
      const centerViewport = () => {
        if (!renderedEl) return;
        contentEl.scrollLeft = Math.max(0, (contentEl.scrollWidth - contentEl.clientWidth) / 2);
        contentEl.scrollTop = 0;
      };
      const centerViewportOnce = () => {
        if (centeredInitially) return;
        centeredInitially = true;
        window.activeWindow.requestAnimationFrame(() => {
          centerViewport();
        });
      };

      zoomOutBtn.addEventListener('click', () => {
        setZoom(zoom - 0.1);
      });
      zoomResetBtn.addEventListener('click', () => {
        setZoom(1);
      });
      zoomInBtn.addEventListener('click', () => {
        setZoom(zoom + 0.1);
      });

      const onPanMouseMove = (event: MouseEvent) => {
        if (!isPanning) return;
        const dx = event.clientX - panStartX;
        const dy = event.clientY - panStartY;
        contentEl.scrollLeft = panScrollLeft - dx;
        contentEl.scrollTop = panScrollTop - dy;
      };

      const stopPan = () => {
        if (!isPanning) return;
        isPanning = false;
        contentEl.classList.remove('is-panning');
      };

      const onPanMouseUp = () => {
        stopPan();
      };

      contentEl.addEventListener('mousedown', (event: MouseEvent) => {
        if (event.button !== 0) return;
        if (!renderedEl) return;
        isPanning = true;
        panStartX = event.clientX;
        panStartY = event.clientY;
        panScrollLeft = contentEl.scrollLeft;
        panScrollTop = contentEl.scrollTop;
        contentEl.classList.add('is-panning');
        event.preventDefault();
      });
      contentEl.addEventListener('mouseleave', onPanMouseUp);
      window.addEventListener('mousemove', onPanMouseMove);
      window.addEventListener('mouseup', onPanMouseUp);

      const closeOverlay = () => {
        window.activeDocument.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('resize', fitToViewport);
        window.removeEventListener('mousemove', onPanMouseMove);
        window.removeEventListener('mouseup', onPanMouseUp);
        overlayEl.remove();
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          closeOverlay();
        }
      };

      overlayEl.addEventListener('click', (event) => {
        if (event.target === overlayEl) {
          closeOverlay();
        }
      });
      closeBtn.addEventListener('click', closeOverlay);
      window.activeDocument.addEventListener('keydown', onKeyDown);
      window.addEventListener('resize', fitToViewport);

      try {
        if (this.settings.imageFormat === 'svg') {
          const response = await this.requestDiagram(renderSource, 'svg', diagramType);

          if (response.status !== 200) {
            throw new Error(`HTTP ${response.status}`);
          }
          const contentType = this.responseContentType(response);
          if (contentType && !contentType.includes('image/svg')) {
            throw new Error(
              `Expected SVG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`,
            );
          }
          if (!response.text.includes('<svg')) {
            throw new Error('Response is not SVG content.');
          }

          loadingEl.remove();
          const svgHost = canvasEl.createDiv();
          const svgEl = parseSvgMarkup(response.text);
          if (svgEl) {
            svgEl.addClass('puml-zoom-svg');
            let baseSvgWidth = 0;
            try {
              const bbox = svgEl.getBBox();
              if (bbox.width > 0 && bbox.height > 0) {
                svgEl.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
                baseSvgWidth = bbox.width;
              }
            } catch (error) {
              console.debug('Failed to crop SVG by bbox', error);
            }

            renderedEl = svgEl;
            const viewBoxWidth = baseSvgWidth || (svgEl.viewBox?.baseVal?.width ?? 0);
            const widthAttr = Number.parseFloat(svgEl.getAttribute('width') ?? '0');
            const measuredWidth = svgEl.getBoundingClientRect().width;
            baseWidth = viewBoxWidth || widthAttr || measuredWidth || 1000;
            fitToViewport();
            centerViewportOnce();
            svgHost.appendChild(svgEl);
          } else {
            throw new Error('Response is not valid SVG content.');
          }
          canvasEl.appendChild(svgHost);
        } else {
          const img = canvasEl.createEl('img', { cls: 'puml-zoom-image puml-is-hidden' });
          img.alt = `${diagramLabel} diagram`;
          const objectUrl = await this.fetchPngObjectUrl(renderSource, diagramType);
          img.src = objectUrl;

          img.addEventListener(
            'load',
            () => {
              loadingEl.remove();
              renderedEl = img;
              baseWidth = img.naturalWidth || img.getBoundingClientRect().width || 1000;
              fitToViewport();
              img.removeClass('puml-is-hidden');
              centerViewportOnce();
              URL.revokeObjectURL(objectUrl);
            },
            { once: true },
          );
          img.addEventListener(
            'error',
            () => {
              loadingEl.remove();
              URL.revokeObjectURL(objectUrl);
              canvasEl.createDiv({ cls: 'puml-embed-error', text: 'Failed to load PNG diagram.' });
            },
            { once: true },
          );
        }
      } catch (error) {
        loadingEl.remove();
        canvasEl.createDiv({
          cls: 'puml-embed-error',
          text: `Failed to render diagram: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    };

    zoomBtn.addEventListener('click', () => {
      void openZoomOverlay();
    });
    saveBtn.addEventListener('click', (event: MouseEvent) => {
      const menu = new Menu();
      menu.addItem((item) =>
        item.setTitle('Save as PNG').onClick(async () => {
          try {
            await this.downloadDiagramAs(renderSource, 'png', `${diagramType}-diagram`, diagramType);
            new Notice('Diagram saved as PNG');
          } catch (error) {
            new Notice(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        }),
      );
      menu.addItem((item) =>
        item.setTitle('Save as SVG').onClick(async () => {
          try {
            await this.downloadDiagramAs(renderSource, 'svg', `${diagramType}-diagram`, diagramType);
            new Notice('Diagram saved as SVG');
          } catch (error) {
            new Notice(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        }),
      );
      menu.addSeparator();
      menu.addItem((item) =>
        item.setTitle(`Save as .${DIAGRAM_SOURCE_EXTENSION[diagramType]} file`).onClick(async () => {
          try {
            await this.saveSourceAsFile(renderSource, diagramType, sourcePath);
          } catch (error) {
            new Notice(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        }),
      );
      menu.showAtMouseEvent(event);
    });
    copyBlockBtn.addEventListener('click', () => {
      void (async () => {
        try {
          await navigator.clipboard.writeText(
            buildFencedCodeBlock(source, diagramType, fenceWidthHintPx),
          );
          new Notice(`${diagramLabel} code block copied.`);
        } catch (error) {
          new Notice(`Copy failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      })();
    });
    copyBtn.addEventListener('click', () => {
      void (async () => {
        try {
          await navigator.clipboard.writeText(renderSource);
          new Notice(`${diagramLabel} code copied.`);
        } catch (error) {
          new Notice(`Copy failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      })();
    });

    const loadingEl = diagramPane.createDiv({ cls: 'puml-loading', text: 'Generating diagram...' });
    try {
      if (this.settings.imageFormat === 'svg') {
        const response = await this.requestDiagram(renderSource, 'svg', diagramType);

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        const contentType = this.responseContentType(response);
        if (contentType && !contentType.includes('image/svg')) {
          throw new Error(
            `Expected SVG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`,
          );
        }
        if (!response.text.includes('<svg')) {
          throw new Error('Response is not SVG content.');
        }

        loadingEl.remove();
        const svgHost = diagramPane.createDiv();
        const svgEl = parseSvgMarkup(response.text);
        if (svgEl) {
          svgEl.addClass('puml-embed-svg');
          svgHost.appendChild(svgEl);
        } else {
          throw new Error('Response is not valid SVG content.');
        }
      } else {
        const img = diagramPane.createEl('img', { cls: 'puml-embed-image puml-is-hidden' });
        const objectUrl = await this.fetchPngObjectUrl(renderSource, diagramType);
        img.src = objectUrl;
        img.alt = `${diagramLabel} diagram`;
        img.addEventListener(
          'load',
          () => {
            loadingEl.remove();
            img.removeClass('puml-is-hidden');
            URL.revokeObjectURL(objectUrl);
          },
          { once: true },
        );
        img.addEventListener(
          'error',
          () => {
            loadingEl.remove();
            URL.revokeObjectURL(objectUrl);
            diagramPane.createDiv({ cls: 'puml-embed-error', text: 'Failed to load PNG diagram.' });
          },
          { once: true },
        );
      }
    } catch (error) {
      diagramPane.empty();
      diagramPane.createDiv({
        cls: 'puml-embed-error',
        text: `Failed to render diagram: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  async saveSourceAsFile(source: string, diagramType: DiagramType, sourcePath: string): Promise<void> {
    if (!source.trim()) {
      new Notice('Diagram code is empty.');
      return;
    }
    const ext = DIAGRAM_SOURCE_EXTENSION[diagramType];
    const noteFile = sourcePath ? this.app.vault.getAbstractFileByPath(sourcePath) : null;
    const folder = noteFile instanceof TFile ? noteFile.parent?.path ?? '' : '';

    const startUmlName = diagramType === 'plantuml' ? source.match(/^\s*@start\w+\s+(.+?)\s*$/m)?.[1] : undefined;
    const baseName =
      sanitizeFileBaseName(startUmlName ?? '') ||
      (noteFile instanceof TFile ? sanitizeFileBaseName(noteFile.basename) : '') ||
      `${diagramType}-diagram`;
    const defaultPath = normalizePath(
      folder && folder !== '/' ? `${folder}/${baseName}.${ext}` : `${baseName}.${ext}`,
    );

    const outputPath = await this.resolveExportOutputPath(defaultPath);
    if (!outputPath) return;

    const content = source.endsWith('\n') ? source : `${source}\n`;
    const existing = this.app.vault.getAbstractFileByPath(outputPath);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
    } else if (existing) {
      throw new Error(`"${outputPath}" is not a file.`);
    } else {
      await this.app.vault.create(outputPath, content);
    }
    new Notice(`Saved: ${outputPath}`);
  }

  async resolveExportOutputPath(defaultPath: string): Promise<string | null> {
    const existing = this.app.vault.getAbstractFileByPath(defaultPath);
    if (!existing) return defaultPath;

    if (!(existing instanceof TFile)) {
      return this.getNextAvailableExportPath(defaultPath);
    }

    const action = await new Promise<ExportConflictAction>((resolve) => {
      new ExportConflictModal(this.app, defaultPath, resolve).open();
    });
    if (action === 'cancel') return null;
    if (action === 'overwrite') return defaultPath;
    return this.getNextAvailableExportPath(defaultPath);
  }

  private getNextAvailableExportPath(path: string): string {
    const slashIndex = path.lastIndexOf('/');
    const dir = slashIndex >= 0 ? path.slice(0, slashIndex) : '';
    const fileName = slashIndex >= 0 ? path.slice(slashIndex + 1) : path;
    const dotIndex = fileName.lastIndexOf('.');
    const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
    const ext = dotIndex > 0 ? fileName.slice(dotIndex) : '';

    let index = 1;
    while (index < 10_000) {
      const candidateName = `${base}-${index}${ext}`;
      const candidatePath = normalizePath(dir ? `${dir}/${candidateName}` : candidateName);
      if (!this.app.vault.getAbstractFileByPath(candidatePath)) {
        return candidatePath;
      }
      index += 1;
    }

    throw new Error(`Could not find available file name for "${path}".`);
  }

  private createLivePreviewMermaidExtension() {
    const sync = (view: EditorView) => this.syncLivePreviewMermaidBlocks(view);
    return ViewPlugin.fromClass(
      class {
        private readonly observer: MutationObserver;
        private scheduled = false;
        private destroyed = false;

        constructor(private readonly view: EditorView) {
          this.observer = new MutationObserver(() => this.schedule());
          this.observer.observe(view.contentDOM, { childList: true, subtree: true });
          this.schedule();
        }

        update(update: ViewUpdate): void {
          if (update.docChanged || update.viewportChanged) this.schedule();
        }

        destroy(): void {
          this.destroyed = true;
          this.observer.disconnect();
        }

        private schedule(): void {
          if (this.scheduled || this.destroyed) return;
          this.scheduled = true;
          this.view.dom.win.requestAnimationFrame(() => {
            this.scheduled = false;
            if (!this.destroyed) sync(this.view);
          });
        }
      },
    );
  }

  private readonly livePreviewMermaidKeys = new WeakMap<HTMLElement, string>();

  private syncLivePreviewMermaidBlocks(view: EditorView): void {
    const widgets = view.contentDOM.querySelectorAll<HTMLElement>(
      '.cm-preview-code-block.cm-lang-mermaid',
    );
    widgets.forEach((widgetEl) => {
      const block = this.readLivePreviewMermaidFence(view, widgetEl);
      if (!block) return;
      const key = `${block.widthHintPx ?? ''}\n${block.source}`;
      if (this.livePreviewMermaidKeys.get(widgetEl) === key) return;
      this.livePreviewMermaidKeys.set(widgetEl, key);

      widgetEl.addClass('puml-mermaid-takeover');
      Array.from(widgetEl.children).forEach((child) => {
        if (child.hasClass('puml-mermaid-host')) child.remove();
      });
      const host = widgetEl.createDiv({ cls: 'puml-mermaid-host' });
      const sourcePath = view.state.field(editorInfoField, false)?.file?.path ?? '';
      void this.renderEmbeddedDiagramBlock(
        block.source,
        host,
        block.widthHintPx,
        'mermaid',
        sourcePath,
      );
    });
  }

  private readLivePreviewMermaidFence(
    view: EditorView,
    widgetEl: HTMLElement,
  ): { source: string; widthHintPx: number | null } | null {
    let pos: number;
    try {
      pos = view.posAtDOM(widgetEl);
    } catch {
      return null;
    }
    const doc = view.state.doc;
    const openerRegex = /^\s*(`{3,}|~{3,})\s*mermaid\b(.*)$/i;
    const firstLine = doc.lineAt(pos).number;

    for (let lineNo = firstLine; lineNo <= Math.min(doc.lines, firstLine + 1); lineNo++) {
      const opener = doc.line(lineNo).text.match(openerRegex);
      if (!opener) continue;

      const fence = opener[1];
      const closerRegex = new RegExp(`^\\s*${fence[0]}{${fence.length},}\\s*$`);
      const bodyLines: string[] = [];
      for (let n = lineNo + 1; n <= doc.lines; n++) {
        const text = doc.line(n).text;
        if (closerRegex.test(text)) break;
        bodyLines.push(text);
      }

      const widthMatch = (opener[2] ?? '').match(/\|(\d{2,4})/);
      const widthHintPx = widthMatch ? Math.min(6000, Math.max(120, Number(widthMatch[1]))) : null;
      return { source: bodyLines.join('\n'), widthHintPx };
    }
    return null;
  }

  private extractEmbeddedWidthHint(
    source: string,
    fenceWidthHintPx: number | null,
  ): { renderSource: string; widthHintPx: number | null } {
    if (fenceWidthHintPx) {
      return { renderSource: source, widthHintPx: fenceWidthHintPx };
    }

    const lines = source.split('\n');
    const firstNonEmpty = lines.findIndex((line) => line.trim().length > 0);
    if (firstNonEmpty === -1) {
      return { renderSource: source, widthHintPx: null };
    }

    const match = lines[firstNonEmpty].trim().match(/^\|(\d{2,4})$/);
    if (!match) {
      return { renderSource: source, widthHintPx: null };
    }

    const widthHintPx = Math.min(6000, Math.max(120, Number(match[1])));
    lines.splice(firstNonEmpty, 1);
    return { renderSource: lines.join('\n'), widthHintPx };
  }

  private extractFenceWidthHint(sectionText: string, source: string, language: DiagramType): number | null {
    const escapedLanguage = language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      '`{3,}\\s*' + escapedLanguage + '(?:\\s+\\|(\\d{2,4}))?\\s*\\n([\\s\\S]*?)`{3,}',
      'gi',
    );
    let match: RegExpExecArray | null = regex.exec(sectionText);
    while (match) {
      const widthRaw = match[1];
      const blockSource = match[2] ?? '';
      if (blockSource.trim() === source.trim() && widthRaw) {
        return Math.min(6000, Math.max(120, Number(widthRaw)));
      }
      match = regex.exec(sectionText);
    }
    return null;
  }

  renderHighlightedLine(target: HTMLElement, line: string, diagramType: DiagramType | null): void {
    if (diagramType === 'plantuml') {
      this.renderPlantUmlHighlightedLine(target, line);
    } else if (diagramType === 'mermaid') {
      this.renderMermaidHighlightedLine(target, line);
    } else {
      target.appendText(line);
    }
  }

  applyEditorWrapToOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PUML)) {
      if (leaf.view instanceof PUMLViewerView) leaf.view.applyEditorWrap();
    }
  }

  renderPlantUmlHighlightedLine(target: HTMLElement, line: string): void {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("'") || trimmed.startsWith('//')) {
      target.createSpan({ cls: 'puml-code-comment', text: line });
      return;
    }

    const tokenRegex =
      /(![A-Za-z_]\w*|@[A-Za-z_]\w*|\b(?:actor|participant|boundary|control|entity|database|collections|queue|title|autonumber|skinparam|hide|show|note|left|right|of|as|alt|else|opt|loop|par|break|critical|group|end|if|then|start|stop|emit|endwhile|while|is|endif)\b|"[^"]*"|'[^']*')/gi;

    let lastIndex = 0;
    let match: RegExpExecArray | null = tokenRegex.exec(line);
    while (match) {
      const start = match.index;
      const token = match[0];

      if (start > lastIndex) {
        target.appendText(line.slice(lastIndex, start));
      }

      let cls = 'puml-code-keyword';
      if (token.startsWith('!') || token.startsWith('@')) {
        cls = 'puml-code-directive';
      } else if (token.startsWith('"') || token.startsWith("'")) {
        cls = 'puml-code-string';
      }

      target.createSpan({ cls, text: token });
      lastIndex = start + token.length;
      match = tokenRegex.exec(line);
    }

    if (lastIndex < line.length) {
      target.appendText(line.slice(lastIndex));
    }
  }

  renderMermaidHighlightedLine(target: HTMLElement, line: string): void {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('%%{')) {
      target.createSpan({ cls: 'puml-code-directive', text: line });
      return;
    }
    if (trimmed.startsWith('%%')) {
      target.createSpan({ cls: 'puml-code-comment', text: line });
      return;
    }

    const tokenRegex = new RegExp(
      [
        // Message / label text after ":" stays plain (avoids highlighting words like "and", "end").
        String.raw`(?<rest>:(?!::).*$)`,
        String.raw`(?<arrow><\|--|<\|\.\.|[|}][|o](?:--|\.\.)[o|][|{]|<?-\.+->?|<?={2,}>?|<?-{2,}(?:>>|[>xo)])?|-(?:>>|[>x)])|\.\.\|?>|\.\.|~~~|[*o]--)`,
        String.raw`(?<string>"[^"]*"|\|[^|]*\|)`,
        String.raw`(?<label>\(\([^)]*\)\)|\[\[[^\]]*\]\]|\[\([^)]*\)\]|\(\[[^\]]*\]\)|\{\{[^}]*\}\}|\[[^\]]*\]|\([^)]*\)|\{[^}]*\})`,
        String.raw`(?<diagram>\b(?:graph|flowchart|sequenceDiagram|classDiagram(?:-v2)?|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|sankey-beta|xychart-beta|block-beta|packet-beta|architecture-beta|kanban|radar-beta)\b)`,
        String.raw`(?<keyword>\b(?:subgraph|end|direction|TB|TD|BT|RL|LR|participant|actor|as|loop|alt|else|opt|par|and|critical|break|rect|box|note|Note|left of|right of|over|activate|deactivate|autonumber|create|destroy|title|section|class|classDef|style|linkStyle|click|call|href|state|namespace|dateFormat|axisFormat|tickInterval|excludes|includes|todayMarker|accTitle|accDescr|commit|branch|checkout|merge|cherry-pick|showData)\b)`,
        String.raw`(?<style>:::[A-Za-z_][\w-]*)`,
      ].join('|'),
      'g',
    );

    let lastIndex = 0;
    let match: RegExpExecArray | null = tokenRegex.exec(line);
    while (match) {
      const start = match.index;
      const token = match[0];
      if (!token) {
        tokenRegex.lastIndex += 1;
        match = tokenRegex.exec(line);
        continue;
      }

      if (start > lastIndex) {
        target.appendText(line.slice(lastIndex, start));
      }

      const groups = match.groups ?? {};
      if (groups.rest !== undefined) {
        target.appendText(token);
      } else {
        let cls = 'puml-code-keyword';
        if (groups.string !== undefined || groups.label !== undefined) {
          cls = 'puml-code-string';
        } else if (groups.arrow !== undefined) {
          cls = 'puml-code-arrow';
        } else if (groups.diagram !== undefined || groups.style !== undefined) {
          cls = 'puml-code-directive';
        }
        target.createSpan({ cls, text: token });
      }

      lastIndex = start + token.length;
      match = tokenRegex.exec(line);
    }

    if (lastIndex < line.length) {
      target.appendText(line.slice(lastIndex));
    }
  }
}

class PUMLViewerView extends ItemView {
  plugin: PUMLViewerPlugin;
  currentFile: TFile | null = null;

  private mode: ViewMode = 'view';
  private zoom = 1;
  private statusEl!: HTMLDivElement;
  private zoomValueEl!: HTMLDivElement;
  private imageWrapEl!: HTMLDivElement;
  private contentHostEl!: HTMLDivElement;
  private viewModeBtn!: HTMLButtonElement;
  private editModeBtn!: HTMLButtonElement;
  private splitModeBtn!: HTMLButtonElement;
  private saveBtn!: HTMLButtonElement;
  private zoomOutBtn!: HTMLButtonElement;
  private zoomResetBtn!: HTMLButtonElement;
  private zoomInBtn!: HTMLButtonElement;
  private exportPngBtn!: HTMLButtonElement;
  private exportSvgBtn!: HTMLButtonElement;
  private exportAsciiBtn!: HTMLButtonElement;
  private copyBlockBtn!: HTMLButtonElement;
  private editorGutterEl: HTMLDivElement | null = null;
  private editorHighlightEl: HTMLPreElement | null = null;
  private editorShellEl: HTMLDivElement | null = null;
  private editorResizeObserver: ResizeObserver | null = null;
  private editorEl: HTMLTextAreaElement | null = null;
  private editorDraft: string | null = null;
  private draftFilePath: string | null = null;
  private isDirty = false;
  private isMainPanning = false;
  private mainPanStartX = 0;
  private mainPanStartY = 0;
  private mainPanScrollLeft = 0;
  private mainPanScrollTop = 0;
  private mainPanEl: HTMLElement | null = null;
  private previewScrollEl: HTMLDivElement | null = null;
  private previewErrorEl: HTMLDivElement | null = null;
  private previewBadgeEl: HTMLDivElement | null = null;
  private previewTimer: number | null = null;
  private previewSeq = 0;
  private lastPreviewSource: string | null = null;
  private previewFitted = false;
  private splitResizeObserver: ResizeObserver | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: PUMLViewerPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_PUML;
  }

  getDisplayText(): string {
    return this.currentFile ? `Diagram: ${this.currentFile.name}` : 'Diagram Viewer';
  }

  getIcon(): string {
    return 'git-branch-plus';
  }

  private getCurrentDiagramType(): DiagramType | null {
    if (!this.currentFile) return null;
    return getDiagramTypeByExtension(this.currentFile.extension);
  }

  async onOpen(): Promise<void> {
    const viewContainer = this.containerEl.children[1] as HTMLElement;
    viewContainer.empty();
    viewContainer.addClass('puml-viewer-container');

    const toolbar = viewContainer.createDiv({ cls: 'puml-viewer-toolbar' });

    this.viewModeBtn = toolbar.createEl('button', { text: 'View' });
    this.viewModeBtn.addEventListener('click', () => {
      void this.switchMode('view');
    });

    this.editModeBtn = toolbar.createEl('button', { text: 'Edit' });
    this.editModeBtn.addEventListener('click', () => {
      void this.switchMode('edit');
    });

    this.splitModeBtn = toolbar.createEl('button', { text: 'Split' });
    this.splitModeBtn.setAttr('aria-label', 'Edit code with live preview');
    this.splitModeBtn.addEventListener('click', () => {
      void this.switchMode('split');
    });

    this.saveBtn = toolbar.createEl('button', { text: 'Save' });
    this.saveBtn.addEventListener('click', () => {
      void this.saveEditor();
    });

    this.zoomOutBtn = toolbar.createEl('button', { text: '-' });
    this.zoomOutBtn.addEventListener('click', () => {
      this.setZoom(this.zoom - 0.1);
    });

    this.zoomResetBtn = toolbar.createEl('button', { text: '100%' });
    this.zoomResetBtn.addEventListener('click', () => {
      this.setZoom(1);
    });

    this.zoomInBtn = toolbar.createEl('button', { text: '+' });
    this.zoomInBtn.addEventListener('click', () => {
      this.setZoom(this.zoom + 0.1);
    });

    const refreshBtn = toolbar.createEl('button', { text: 'Refresh' });
    refreshBtn.addEventListener('click', () => {
      if (this.mode === 'view') {
        void this.renderDiagram();
      } else if (this.mode === 'split') {
        void this.updatePreview(true);
      } else {
        void this.reloadEditorFromFile();
      }
    });

    this.exportPngBtn = toolbar.createEl('button', { cls: 'puml-toolbar-export-btn', text: 'PNG' });
    this.exportPngBtn.setAttr('aria-label', 'Save PNG image');
    this.exportPngBtn.addEventListener('click', () => {
      void this.exportDiagram('png');
    });

    this.exportSvgBtn = toolbar.createEl('button', { cls: 'puml-toolbar-export-btn', text: 'SVG' });
    this.exportSvgBtn.setAttr('aria-label', 'Save SVG image');
    this.exportSvgBtn.addEventListener('click', () => {
      void this.exportDiagram('svg');
    });

    this.exportAsciiBtn = toolbar.createEl('button', { cls: 'puml-toolbar-export-btn', text: 'ASCII' });
    this.exportAsciiBtn.setAttr('aria-label', 'Save ASCII art');
    this.exportAsciiBtn.addEventListener('click', () => {
      void this.exportDiagram('txt');
    });

    this.copyBlockBtn = toolbar.createEl('button', { cls: 'puml-toolbar-export-btn', text: 'Copy block' });
    this.copyBlockBtn.setAttr('aria-label', 'Copy as markdown code block');
    this.copyBlockBtn.addEventListener('click', () => {
      void this.copyAsCodeBlock();
    });

    this.statusEl = toolbar.createDiv({ cls: 'puml-viewer-status' });
    this.statusEl.setText('Waiting for file...');
    this.zoomValueEl = toolbar.createDiv({ cls: 'puml-viewer-status' });

    this.imageWrapEl = viewContainer.createDiv({ cls: 'puml-viewer-image-wrap' });
    this.contentHostEl = this.imageWrapEl.createDiv({ cls: 'puml-viewer-content-host' });
    this.bindMainViewPanning();

    this.updateToolbarState();
    await this.loadFileFromState();

    this.registerEvent(
      this.app.vault.on('modify', async (file) => {
        if (!this.currentFile || file.path !== this.currentFile.path) return;

        if (this.mode === 'view') {
          if (this.plugin.settings.autoRefresh) {
            await this.renderDiagram();
          }
          return;
        }

        if (!this.isDirty) {
          // reloadEditorFromFile also refreshes the split preview.
          await this.reloadEditorFromFile();
          this.statusEl.setText(`Updated from disk: ${this.currentFile.name}`);
        } else {
          this.statusEl.setText('File changed on disk. Unsaved editor changes are kept.');
        }
      }),
    );
  }

  async onClose(): Promise<void> {
    this.teardownSplit();
    this.editorResizeObserver?.disconnect();
    this.editorResizeObserver = null;
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);

    const viewState = (state ?? {}) as PUMLViewState;

    if (viewState.mode) {
      this.mode = viewState.mode;
      this.updateToolbarState();
    }

    if (!viewState.file) return;

    const file = this.app.vault.getAbstractFileByPath(viewState.file);
    if (file instanceof TFile) {
      this.currentFile = file;
      void this.plugin.rememberLastPuml(file.path);
      this.resetDraftIfFileChanged();
      this.updateToolbarState();
      await this.renderActiveMode();
    }
  }

  getState(): Record<string, unknown> {
    return { file: this.currentFile?.path, mode: this.mode };
  }

  private async loadFileFromState(): Promise<void> {
    const state = this.leaf.getViewState().state;
    const mode = state?.mode;
    if (mode === 'view' || mode === 'edit' || mode === 'split') {
      this.mode = mode;
      this.updateToolbarState();
    }

    const candidates: string[] = [];
    if (typeof state?.file === 'string') candidates.push(state.file);

    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && getDiagramTypeByExtension(activeFile.extension)) candidates.push(activeFile.path);

    if (this.plugin.settings.lastOpenedPumlPath) {
      candidates.push(this.plugin.settings.lastOpenedPumlPath);
    }

    const workspaceAny = this.app.workspace as unknown as { getLastOpenFiles?: () => string[] };
    const lastOpenFiles = workspaceAny.getLastOpenFiles?.() ?? [];
    for (const path of lastOpenFiles) {
      if (/\.(puml|mermaid|mmd|marmaid)$/i.test(path)) candidates.push(path);
    }

    const tried = new Set<string>();
    for (const path of candidates) {
      if (!path || tried.has(path)) continue;
      tried.add(path);
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile && getDiagramTypeByExtension(file.extension)) {
        this.currentFile = file;
        void this.plugin.rememberLastPuml(file.path);
        this.resetDraftIfFileChanged();
        this.updateToolbarState();
        await this.renderActiveMode();
        return;
      }
    }

    await this.renderActiveMode();
  }

  private async switchMode(mode: ViewMode): Promise<void> {
    if (this.mode === mode) return;
    this.mode = mode;
    this.updateToolbarState();
    await this.renderActiveMode();
  }

  private async renderActiveMode(): Promise<void> {
    if (!this.contentHostEl) return;

    if (this.mode === 'edit') {
      await this.renderEditor();
      return;
    }
    if (this.mode === 'split') {
      await this.renderSplit();
      return;
    }

    await this.renderDiagram();
  }

  private updateToolbarState(): void {
    if (
      !this.viewModeBtn ||
      !this.editModeBtn ||
      !this.saveBtn ||
      !this.zoomOutBtn ||
      !this.zoomResetBtn ||
      !this.zoomInBtn ||
      !this.exportPngBtn ||
      !this.exportSvgBtn ||
      !this.exportAsciiBtn ||
      !this.copyBlockBtn
    )
      return;

    this.viewModeBtn.toggleClass('is-active', this.mode === 'view');
    this.editModeBtn.toggleClass('is-active', this.mode === 'edit');
    this.splitModeBtn?.toggleClass('is-active', this.mode === 'split');
    const showsDiagram = this.mode === 'view' || this.mode === 'split';
    const hasEditor = this.mode === 'edit' || this.mode === 'split';
    const diagramType = this.getCurrentDiagramType();
    const canExport = showsDiagram && !!this.currentFile && !!diagramType;
    // Inactive buttons are hidden instead of shown disabled.
    const setAvailable = (button: HTMLButtonElement, available: boolean) => {
      button.disabled = !available;
      button.toggle(available);
    };
    setAvailable(this.saveBtn, hasEditor);
    setAvailable(this.zoomOutBtn, showsDiagram);
    setAvailable(this.zoomResetBtn, showsDiagram);
    setAvailable(this.zoomInBtn, showsDiagram);
    setAvailable(this.exportPngBtn, canExport);
    setAvailable(this.exportSvgBtn, canExport);
    // Mermaid has no ASCII output (neither Kroki nor mermaid.js).
    setAvailable(this.exportAsciiBtn, canExport && diagramType !== 'mermaid');
    setAvailable(this.copyBlockBtn, !!this.currentFile && !!diagramType);
    this.zoomValueEl?.toggle(showsDiagram);
    this.updateZoomLabel();
  }

  private resetDraftIfFileChanged(): void {
    const filePath = this.currentFile?.path ?? null;
    if (filePath && this.draftFilePath !== filePath) {
      this.editorDraft = null;
      this.isDirty = false;
      this.draftFilePath = filePath;
    }
  }

  private resetContentHost(layout: 'view' | 'editor' | 'split'): void {
    this.teardownSplit();
    this.contentHostEl.empty();
    this.contentHostEl.toggleClass('puml-viewer-content-host--view', layout === 'view');
    this.contentHostEl.toggleClass('puml-viewer-content-host--editor', layout === 'editor');
    this.contentHostEl.toggleClass('puml-viewer-content-host--split', layout === 'split');
    this.contentHostEl.removeClass('is-stacked');
    this.imageWrapEl.toggleClass('puml-viewer-image-wrap--view', layout === 'view');
    this.imageWrapEl.removeClass('is-pan-enabled');
    this.imageWrapEl.removeClass('is-panning');
    this.isMainPanning = false;
    this.mainPanEl = null;
    this.editorResizeObserver?.disconnect();
    this.editorResizeObserver = null;
    this.editorShellEl = null;
    this.editorGutterEl = null;
    this.editorHighlightEl = null;
    this.editorEl = null;
  }

  private async renderEditor(): Promise<void> {
    this.resetContentHost('editor');
    if (!this.currentFile) {
      this.statusEl.setText('No diagram file selected.');
      return;
    }
    await this.buildEditor(this.contentHostEl);
  }

  /** Builds the highlighted code editor inside `parent`. Returns false if the source could not be loaded. */
  private async buildEditor(parent: HTMLElement): Promise<boolean> {
    if (!this.currentFile) return false;

    try {
      const initialText =
        this.draftFilePath === this.currentFile.path && this.editorDraft !== null
          ? this.editorDraft
          : await this.app.vault.read(this.currentFile);

      this.editorDraft = initialText;
      this.draftFilePath = this.currentFile.path;

      const editorShell = parent.createDiv({ cls: 'puml-viewer-editor-shell' });
      this.editorShellEl = editorShell;
      this.editorGutterEl = editorShell.createDiv({ cls: 'puml-viewer-editor-gutter' });
      const editorStack = editorShell.createDiv({ cls: 'puml-viewer-editor-stack' });
      this.editorHighlightEl = editorStack.createEl('pre', { cls: 'puml-viewer-editor-highlight' });
      this.editorHighlightEl.setAttr('aria-hidden', 'true');
      this.editorEl = editorStack.createEl('textarea', { cls: 'puml-viewer-editor' });
      this.editorEl.setAttr('spellcheck', 'false');
      this.editorEl.value = initialText;
      this.applyEditorWrap();
      this.updateEditorLineNumbers(initialText);
      this.updateEditorHighlight(initialText);
      // Wrapped line heights depend on the editor width.
      this.editorResizeObserver = new ResizeObserver(() => this.syncEditorLineGeometry());
      this.editorResizeObserver.observe(editorStack);
      this.editorEl.addEventListener('input', () => {
        if (!this.editorEl) return;
        this.editorDraft = this.editorEl.value;
        this.isDirty = true;
        this.updateEditorLineNumbers(this.editorEl.value);
        this.updateEditorHighlight(this.editorEl.value);
        this.statusEl.setText(`Editing: ${this.currentFile?.name ?? ''} (unsaved)`);
        this.schedulePreview();
      });
      this.editorEl.addEventListener('scroll', () => {
        if (!this.editorEl || !this.editorGutterEl) return;
        this.editorGutterEl.scrollTop = this.editorEl.scrollTop;
        this.syncEditorHighlightScroll();
      });
      this.editorEl.addEventListener('keydown', (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          void this.saveEditor();
        }
      });

      this.statusEl.setText(`Editing: ${this.currentFile.name}${this.isDirty ? ' (unsaved)' : ''}`);
      return true;
    } catch (error) {
      console.error(error);
      this.statusEl.setText('Failed to open editor.');

      const errorEl = parent.createDiv({ cls: 'puml-viewer-error' });
      errorEl.setText(
        `Failed to load source text.\n\n${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async renderSplit(): Promise<void> {
    this.resetContentHost('split');
    if (!this.currentFile) {
      this.statusEl.setText('No diagram file selected.');
      return;
    }

    const host = this.contentHostEl;
    this.applySplitRatio(this.plugin.settings.splitRatio);

    const editorPane = host.createDiv({ cls: 'puml-viewer-split-editor' });
    const divider = host.createDiv({ cls: 'puml-viewer-split-divider' });
    divider.setAttr('role', 'separator');
    divider.setAttr('aria-label', 'Resize editor and preview');
    const previewPane = host.createDiv({ cls: 'puml-viewer-split-preview' });
    this.previewScrollEl = previewPane.createDiv({ cls: 'puml-viewer-split-preview-scroll' });
    this.previewErrorEl = previewPane.createDiv({ cls: 'puml-viewer-preview-error' });
    this.previewErrorEl.hide();
    this.previewBadgeEl = previewPane.createDiv({ cls: 'puml-viewer-preview-badge', text: 'Updating…' });
    this.previewBadgeEl.hide();

    this.splitResizeObserver = new ResizeObserver(() => {
      host.toggleClass('is-stacked', host.clientWidth < SPLIT_STACK_BREAKPOINT_PX);
      this.refreshMainPanAvailability();
    });
    this.splitResizeObserver.observe(host);
    host.toggleClass('is-stacked', host.clientWidth < SPLIT_STACK_BREAKPOINT_PX);

    this.bindSplitDivider(divider);

    const loaded = await this.buildEditor(editorPane);
    if (!loaded || this.mode !== 'split') return;

    this.previewFitted = false;
    this.lastPreviewSource = null;
    await this.updatePreview(true);
  }

  private applySplitRatio(ratio: number): void {
    const clamped = Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, ratio || 0.5));
    // Runtime value: the user drags the divider.
    this.contentHostEl.style.setProperty('--puml-split-ratio', `${(clamped * 100).toFixed(2)}%`);
  }

  private bindSplitDivider(divider: HTMLElement): void {
    const host = this.contentHostEl;
    divider.addEventListener('pointerdown', (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      divider.setPointerCapture(event.pointerId);
      host.addClass('is-resizing');
      let ratio = this.plugin.settings.splitRatio;

      const onMove = (moveEvent: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        const stacked = host.hasClass('is-stacked');
        const raw = stacked
          ? (moveEvent.clientY - rect.top) / Math.max(1, rect.height)
          : (moveEvent.clientX - rect.left) / Math.max(1, rect.width);
        ratio = Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, raw));
        this.applySplitRatio(ratio);
      };
      const onUp = () => {
        divider.removeEventListener('pointermove', onMove);
        divider.removeEventListener('pointerup', onUp);
        divider.removeEventListener('pointercancel', onUp);
        host.removeClass('is-resizing');
        this.refreshMainPanAvailability();
        if (ratio !== this.plugin.settings.splitRatio) {
          this.plugin.settings.splitRatio = ratio;
          void this.plugin.saveSettings();
        }
      };
      divider.addEventListener('pointermove', onMove);
      divider.addEventListener('pointerup', onUp);
      divider.addEventListener('pointercancel', onUp);
    });
  }

  private teardownSplit(): void {
    if (this.previewTimer !== null) {
      window.clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
    // Invalidate in-flight preview requests.
    this.previewSeq += 1;
    this.splitResizeObserver?.disconnect();
    this.splitResizeObserver = null;
    this.previewScrollEl = null;
    this.previewErrorEl = null;
    this.previewBadgeEl = null;
  }

  private schedulePreview(): void {
    if (this.mode !== 'split' || this.plugin.settings.previewOnSaveOnly) return;
    if (this.previewTimer !== null) window.clearTimeout(this.previewTimer);
    const delay = Math.min(5000, Math.max(150, this.plugin.settings.previewDelayMs || 800));
    this.previewTimer = window.setTimeout(() => {
      this.previewTimer = null;
      void this.updatePreview(false);
    }, delay);
  }

  private setPreviewError(message: string | null): void {
    if (!this.previewErrorEl) return;
    if (message) {
      this.previewErrorEl.setText(message);
      this.previewErrorEl.show();
    } else {
      this.previewErrorEl.empty();
      this.previewErrorEl.hide();
    }
  }

  /** Re-renders the split preview from the editor draft, keeping the last good image while loading. */
  private async updatePreview(force: boolean): Promise<void> {
    const scrollEl = this.previewScrollEl;
    const diagramType = this.getCurrentDiagramType();
    if (this.mode !== 'split' || !scrollEl || !this.editorEl || !diagramType) return;

    const source = this.editorEl.value;
    if (!force && source === this.lastPreviewSource) return;
    this.lastPreviewSource = source;
    const seq = ++this.previewSeq;

    if (!source.trim()) {
      scrollEl.empty();
      scrollEl.createDiv({ cls: 'puml-loading', text: 'Nothing to render yet.' });
      this.setPreviewError(null);
      return;
    }

    const hasPrevious = !!scrollEl.querySelector('.puml-viewer-render-root');
    if (!hasPrevious) {
      scrollEl.empty();
      scrollEl.createDiv({ cls: 'puml-loading', text: 'Generating diagram...' });
    }
    this.previewBadgeEl?.show();

    const pending = scrollEl.createDiv({ cls: 'puml-viewer-render-root-pending' });
    try {
      const warning = await this.renderSourceInto(pending, source, diagramType);
      if (seq !== this.previewSeq || !pending.isConnected) {
        pending.remove();
        return;
      }
      Array.from(scrollEl.children).forEach((child) => {
        if (child !== pending) child.remove();
      });
      pending.removeClass('puml-viewer-render-root-pending');
      pending.addClass('puml-viewer-render-root');
      if (this.previewFitted) {
        this.applyZoom();
      } else {
        this.previewFitted = true;
        this.fitToWidth();
      }
      this.refreshMainPanAvailability();
      this.setPreviewError(warning);
    } catch (error) {
      pending.remove();
      if (seq !== this.previewSeq) return;
      scrollEl.querySelectorAll(':scope > .puml-loading').forEach((el) => el.remove());
      this.setPreviewError(
        `Render failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (!scrollEl.querySelector('.puml-viewer-render-root')) {
        // Allow retrying the same text (e.g. after a network hiccup) via Refresh or next edit.
        this.lastPreviewSource = null;
      }
    } finally {
      if (seq === this.previewSeq) this.previewBadgeEl?.hide();
    }
  }

  /**
   * Renders `source` into `root` (SVG or PNG according to settings).
   * Returns a warning when the server answered with an error image (PlantUML syntax errors).
   */
  private async renderSourceInto(
    root: HTMLElement,
    source: string,
    diagramType: DiagramType,
  ): Promise<string | null> {
    const format = this.plugin.settings.imageFormat;
    const response = await this.plugin.requestDiagram(source, format, diagramType);
    const contentType = this.plugin.responseContentType(response);
    const isImage =
      format === 'svg'
        ? contentType.includes('image/svg') || (!contentType && response.text.includes('<svg'))
        : contentType.includes('image/png') || (!contentType && !!response.arrayBuffer);

    if (response.status !== 200 && !isImage) {
      let detail = '';
      try {
        detail = response.text.trim().slice(0, 1500);
      } catch {
        detail = '';
      }
      throw new Error(detail ? `HTTP ${response.status}\n${detail}` : `HTTP ${response.status}`);
    }

    if (format === 'svg') {
      if (!isImage) {
        throw new Error(
          `Expected SVG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`,
        );
      }
      const svgEl = parseSvgMarkup(response.text);
      if (!svgEl) throw new Error('Response is not valid SVG content.');
      root.createDiv().appendChild(svgEl);
    } else {
      if (!isImage) {
        throw new Error(
          `Expected PNG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`,
        );
      }
      if (!response.arrayBuffer) throw new Error('No PNG payload returned by render server');
      const objectUrl = URL.createObjectURL(new Blob([response.arrayBuffer], { type: 'image/png' }));
      const img = root.createEl('img', { cls: 'puml-viewer-image' });
      img.alt = `${diagramType === 'mermaid' ? 'Mermaid' : 'PlantUML'} diagram`;
      await new Promise<void>((resolve, reject) => {
        img.addEventListener(
          'load',
          () => {
            URL.revokeObjectURL(objectUrl);
            resolve();
          },
          { once: true },
        );
        img.addEventListener(
          'error',
          () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load PNG diagram.'));
          },
          { once: true },
        );
        img.src = objectUrl;
      });
    }

    return response.status !== 200
      ? `The render server reported an error (HTTP ${response.status}) — see the diagram above.`
      : null;
  }

  private async reloadEditorFromFile(): Promise<void> {
    if (!this.currentFile || !this.editorEl) return;

    try {
      const source = await this.app.vault.read(this.currentFile);
      this.editorDraft = source;
      this.draftFilePath = this.currentFile.path;
      this.editorEl.value = source;
      this.updateEditorLineNumbers(source);
      this.updateEditorHighlight(source);
      this.isDirty = false;
      if (this.mode === 'split') void this.updatePreview(false);
    } catch (error) {
      console.error(error);
      this.statusEl.setText('Failed to reload source.');
    }
  }

  private async saveEditor(): Promise<void> {
    if (!this.currentFile || !this.editorEl || (this.mode !== 'edit' && this.mode !== 'split')) return;

    try {
      const text = this.editorEl.value;
      await this.app.vault.modify(this.currentFile, text);
      this.editorDraft = text;
      this.draftFilePath = this.currentFile.path;
      this.isDirty = false;
      this.statusEl.setText(`Saved: ${this.currentFile.name}`);
      new Notice('Diagram source saved.');
      if (this.mode === 'split') void this.updatePreview(false);
    } catch (error) {
      console.error(error);
      this.statusEl.setText('Save failed.');
      new Notice('Failed to save diagram source.');
    }
  }

  private async copyAsCodeBlock(): Promise<void> {
    const diagramType = this.getCurrentDiagramType();
    if (!this.currentFile || !diagramType) return;
    try {
      // With the editor open copy what is on screen, including unsaved changes.
      const source =
        (this.mode === 'edit' || this.mode === 'split') && this.editorEl
          ? this.editorEl.value
          : await this.app.vault.read(this.currentFile);
      if (!source.trim()) {
        new Notice('Diagram file is empty.');
        return;
      }
      await navigator.clipboard.writeText(buildFencedCodeBlock(source, diagramType, null));
      new Notice(`Copied as \`\`\`${diagramType} code block.`);
    } catch (error) {
      new Notice(`Copy failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async exportDiagram(format: DiagramFormat): Promise<void> {
    if ((this.mode !== 'view' && this.mode !== 'split') || !this.currentFile) return;
    const diagramType = this.getCurrentDiagramType();
    if (!diagramType) return;
    if (diagramType === 'mermaid' && format === 'txt') {
      new Notice('ASCII export is only available for plantuml.');
      return;
    }

    try {
      // In split mode export what the preview shows (the editor draft).
      const source =
        this.mode === 'split' && this.editorEl
          ? this.editorEl.value
          : await this.app.vault.read(this.currentFile);
      if (!source.trim()) {
        new Notice('Diagram file is empty.');
        return;
      }

      const defaultOutputPath = normalizePath(
        this.currentFile.path.replace(/\.[^/.]+$/i, `.${format}`),
      );
      const outputPath = await this.plugin.resolveExportOutputPath(defaultOutputPath);
      if (!outputPath) {
        this.statusEl.setText('Export cancelled.');
        return;
      }

      const response = await this.plugin.requestDiagram(source, format, diagramType);

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      const existing = this.app.vault.getAbstractFileByPath(outputPath);
      if (existing && !(existing instanceof TFile)) {
        throw new Error(`Cannot export: "${outputPath}" is not a file.`);
      }
      if (format === 'svg') {
        const contentType = this.plugin.responseContentType(response);
        if (contentType && !contentType.includes('image/svg')) {
          throw new Error(`Expected SVG but got "${contentType}"`);
        }
        if (existing instanceof TFile) {
          await this.app.vault.modify(existing, response.text);
        } else {
          await this.app.vault.create(outputPath, response.text);
        }
      } else if (format === 'png') {
        const contentType = this.plugin.responseContentType(response);
        if (contentType && !contentType.includes('image/png')) {
          throw new Error(`Expected PNG but got "${contentType}"`);
        }
        if (!response.arrayBuffer) {
          throw new Error('No PNG payload returned by render server');
        }

        if (existing instanceof TFile) {
          await this.app.vault.modifyBinary(existing, response.arrayBuffer);
        } else {
          await this.app.vault.createBinary(outputPath, response.arrayBuffer);
        }
      } else {
        const contentType = this.plugin.responseContentType(response);
        if (contentType && !contentType.includes('text/plain')) {
          throw new Error(`Expected text/plain but got "${contentType}"`);
        }
        if (existing instanceof TFile) {
          await this.app.vault.modify(existing, response.text);
        } else {
          await this.app.vault.create(outputPath, response.text);
        }
      }

      this.statusEl.setText(`Exported: ${outputPath}`);
      new Notice(`Diagram exported: ${outputPath}`);
    } catch (error) {
      console.error(error);
      this.statusEl.setText('Export failed.');
      new Notice(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async renderDiagram(): Promise<void> {
    this.resetContentHost('view');

    if (!this.currentFile) {
      this.statusEl.setText('No diagram file selected.');
      return;
    }
    const diagramType = this.getCurrentDiagramType();
    if (!diagramType) {
      this.statusEl.setText('Unsupported file type.');
      return;
    }
    const diagramLabel = diagramType === 'mermaid' ? 'Mermaid' : 'PlantUML';
    const file = this.currentFile;
    // resetContentHost() bumps previewSeq, so it doubles as a token for this render.
    const renderSeq = this.previewSeq;

    try {
      const source = await this.app.vault.read(file);

      if (!source.trim()) {
        this.statusEl.setText('File is empty.');
        return;
      }

      this.statusEl.setText(`Rendering: ${file.name}`);
      const renderRoot = this.contentHostEl.createDiv({ cls: 'puml-viewer-render-root' });
      const loadingEl = renderRoot.createDiv({ cls: 'puml-loading', text: 'Generating diagram...' });

      const warning = await this.renderSourceInto(renderRoot, source, diagramType);
      // A newer render (or a mode switch) replaced this one meanwhile.
      if (!renderRoot.isConnected) return;
      loadingEl.remove();

      this.fitToWidth();
      this.refreshMainPanAvailability();
      this.statusEl.setText(warning ?? `Rendered: ${file.name}`);
    } catch (error) {
      console.error(error);
      if (this.mode !== 'view' || renderSeq !== this.previewSeq) return;
      this.statusEl.setText('Render failed.');
      this.contentHostEl.empty();

      const errorEl = this.contentHostEl.createDiv({ cls: 'puml-viewer-error' });
      errorEl.setText(
        `Failed to render diagram.\n\n${error instanceof Error ? error.message : String(error)}`,
      );

      new Notice(`${diagramLabel} render failed.`);
    }
  }

  private setZoom(value: number): void {
    const nextZoom = Math.min(4, Math.max(0.25, Math.round(value * 100) / 100));
    this.zoom = nextZoom;
    this.applyZoom();
    this.refreshMainPanAvailability();
    this.updateZoomLabel();
  }

  /** Scroll container that holds the diagram in the current mode. */
  private getDiagramScrollEl(): HTMLElement | null {
    if (this.mode === 'view') return this.imageWrapEl ?? null;
    if (this.mode === 'split') return this.previewScrollEl;
    return null;
  }

  private fitToWidth(): void {
    const renderRoot = this.contentHostEl?.querySelector<HTMLElement>('.puml-viewer-render-root');
    const scrollEl = this.getDiagramScrollEl();
    if (!renderRoot || !scrollEl) return;

    const imageEl = renderRoot.querySelector<HTMLImageElement>('.puml-viewer-image');
    if (imageEl) {
      const baseWidth = this.getImageBaseWidth(imageEl);
      if (!(baseWidth > 0)) {
        imageEl.addEventListener(
          'load',
          () => {
            this.fitToWidth();
          },
          { once: true },
        );
        return;
      }

      const availableWidth = Math.max(1, scrollEl.clientWidth - 24);
      this.setZoom(Math.min(1, availableWidth / baseWidth));
      return;
    }

    const svgEl = renderRoot.querySelector<SVGSVGElement>('svg');
    if (!svgEl) return;

    const baseWidth = this.getSvgBaseWidth(svgEl);
    if (!(baseWidth > 0)) return;

    const availableWidth = Math.max(1, scrollEl.clientWidth - 24);
    this.setZoom(Math.min(1, availableWidth / baseWidth));
  }

  private updateZoomLabel(): void {
    if (!this.zoomValueEl) return;
    this.zoomValueEl.setText(`Zoom: ${Math.round(this.zoom * 100)}%`);
  }

  private applyZoom(): void {
    const renderRoot = this.contentHostEl?.querySelector<HTMLElement>('.puml-viewer-render-root');
    if (!renderRoot) return;

    const imageEl = renderRoot.querySelector<HTMLImageElement>('.puml-viewer-image');
    if (imageEl) {
      const baseWidth = this.getImageBaseWidth(imageEl);

      if (baseWidth > 0) {
        imageEl.style.maxWidth = CSS_NONE;
        imageEl.style.width = `${Math.max(1, Math.round(baseWidth * this.zoom))}px`;
        imageEl.style.height = CSS_AUTO;
      } else {
        imageEl.addEventListener(
          'load',
          () => {
            this.applyZoom();
          },
          { once: true },
        );
      }
      return;
    }

    const svgEl = renderRoot.querySelector<SVGSVGElement>('svg');
    if (!svgEl) return;

    const baseWidth = this.getSvgBaseWidth(svgEl);

    if (!(baseWidth > 0)) return;

    svgEl.style.maxWidth = CSS_NONE;
    svgEl.style.width = `${Math.max(1, Math.round(baseWidth * this.zoom))}px`;
    svgEl.style.height = CSS_AUTO;
  }

  private bindMainViewPanning(): void {
    this.registerDomEvent(this.imageWrapEl, 'mousedown', (event: MouseEvent) => {
      if (event.button !== 0) return;
      const scrollEl = this.getDiagramScrollEl();
      if (!scrollEl) return;
      // In split mode only the preview pane pans; the editor keeps normal mouse behavior.
      if (this.mode === 'split' && !scrollEl.contains(event.target as Node)) return;
      if (!this.canMainPan()) return;

      this.isMainPanning = true;
      this.mainPanEl = scrollEl;
      this.mainPanStartX = event.clientX;
      this.mainPanStartY = event.clientY;
      this.mainPanScrollLeft = scrollEl.scrollLeft;
      this.mainPanScrollTop = scrollEl.scrollTop;
      scrollEl.addClass('is-panning');
      event.preventDefault();
    });

    this.registerDomEvent(window, 'mousemove', (event: MouseEvent) => {
      if (!this.isMainPanning || !this.mainPanEl) return;
      const dx = event.clientX - this.mainPanStartX;
      const dy = event.clientY - this.mainPanStartY;
      this.mainPanEl.scrollLeft = this.mainPanScrollLeft - dx;
      this.mainPanEl.scrollTop = this.mainPanScrollTop - dy;
      event.preventDefault();
    });

    const stopPanning = () => {
      if (!this.isMainPanning) return;
      this.isMainPanning = false;
      this.mainPanEl?.removeClass('is-panning');
      this.mainPanEl = null;
    };

    this.registerDomEvent(window, 'mouseup', stopPanning);
    this.registerDomEvent(this.imageWrapEl, 'mouseleave', stopPanning);
  }

  private canMainPan(): boolean {
    const scrollEl = this.getDiagramScrollEl();
    if (!scrollEl) return false;
    const hasHorizontal = scrollEl.scrollWidth > scrollEl.clientWidth + 1;
    const hasVertical = scrollEl.scrollHeight > scrollEl.clientHeight + 1;
    return hasHorizontal || hasVertical;
  }

  private refreshMainPanAvailability(): void {
    const scrollEl = this.getDiagramScrollEl();
    if (scrollEl !== this.imageWrapEl) this.imageWrapEl.removeClass('is-pan-enabled');
    if (!scrollEl) return;
    scrollEl.toggleClass('is-pan-enabled', this.canMainPan());
  }

  private getImageBaseWidth(imageEl: HTMLImageElement): number {
    const storedBaseWidth = Number(imageEl.dataset.baseWidth ?? 0);
    const measuredWidth =
      imageEl.naturalWidth || imageEl.clientWidth || imageEl.getBoundingClientRect().width;
    const baseWidth = storedBaseWidth > 0 ? storedBaseWidth : measuredWidth;
    if (baseWidth > 0) {
      imageEl.dataset.baseWidth = String(baseWidth);
    }
    return baseWidth;
  }

  private getSvgBaseWidth(svgEl: SVGSVGElement): number {
    const storedBaseWidth = Number(svgEl.dataset.baseWidth ?? 0);
    let baseWidth = storedBaseWidth;
    if (!(baseWidth > 0)) {
      const viewBoxWidth = svgEl.viewBox?.baseVal?.width ?? 0;
      const widthAttr = Number.parseFloat(svgEl.getAttribute('width') ?? '0');
      const measuredWidth = svgEl.getBoundingClientRect().width;
      baseWidth = viewBoxWidth || widthAttr || measuredWidth;
    }
    if (baseWidth > 0) {
      svgEl.dataset.baseWidth = String(baseWidth);
    }
    return baseWidth;
  }

  /** Applies the "wrap long lines" setting to the open editor (called on settings change too). */
  applyEditorWrap(): void {
    if (!this.editorEl || !this.editorShellEl) return;
    const wrap = this.plugin.settings.editorWordWrap;
    this.editorShellEl.toggleClass('is-wrapping', wrap);
    this.editorEl.setAttr('wrap', wrap ? 'soft' : 'off');
    this.syncEditorLineGeometry();
  }

  private updateEditorHighlight(text: string): void {
    if (!this.editorHighlightEl) return;
    this.editorHighlightEl.empty();
    const diagramType = this.getCurrentDiagramType();
    // One block per source line: lets wrapped lines be measured for the gutter.
    // The trailing empty line (text ending with "\n") still gets a block, like in the textarea.
    for (const line of text.split('\n')) {
      const lineEl = this.editorHighlightEl.createDiv({ cls: 'puml-viewer-editor-hl-line' });
      this.plugin.renderHighlightedLine(lineEl, line, diagramType);
    }
    this.syncEditorLineGeometry();
  }

  /**
   * Keeps highlight layer and gutter aligned with the textarea:
   * - in wrap mode the highlight layer must wrap at the same width (exclude the textarea scrollbar);
   * - each gutter number takes the height of its (possibly wrapped) source line.
   */
  private syncEditorLineGeometry(): void {
    const editorEl = this.editorEl;
    const highlightEl = this.editorHighlightEl;
    const gutterEl = this.editorGutterEl;
    if (!editorEl || !highlightEl || !gutterEl) return;

    const wrap = this.plugin.settings.editorWordWrap;
    const gutterLines = Array.from(gutterEl.children) as HTMLElement[];

    if (!wrap) {
      highlightEl.style.removeProperty('padding-right');
      gutterLines.forEach((lineEl) => lineEl.style.removeProperty('height'));
      this.syncEditorHighlightScroll();
      return;
    }

    // Runtime value: native scrollbar width differs per platform/theme.
    const scrollbarWidth = Math.max(0, editorEl.offsetWidth - editorEl.clientWidth);
    highlightEl.style.paddingRight = `${12 + scrollbarWidth}px`;

    const heights = Array.from(highlightEl.children).map(
      (lineEl) => (lineEl as HTMLElement).getBoundingClientRect().height,
    );
    gutterLines.forEach((lineEl, index) => {
      const height = heights[index];
      if (height > 0) {
        lineEl.style.height = `${height}px`;
      } else {
        lineEl.style.removeProperty('height');
      }
    });
    this.syncEditorHighlightScroll();
  }

  private syncEditorHighlightScroll(): void {
    if (!this.editorEl || !this.editorHighlightEl) return;
    this.editorHighlightEl.scrollTop = this.editorEl.scrollTop;
    this.editorHighlightEl.scrollLeft = this.editorEl.scrollLeft;
  }

  private updateEditorLineNumbers(text: string): void {
    if (!this.editorGutterEl) return;
    this.editorGutterEl.empty();

    const lineCount = Math.max(1, text.split('\n').length);
    for (let i = 1; i <= lineCount; i++) {
      this.editorGutterEl.createDiv({ cls: 'puml-viewer-editor-line', text: String(i) });
    }
  }
}

class ExportConflictModal extends Modal {
  private resolved = false;
  private readonly onResolve: (action: ExportConflictAction) => void;
  private readonly path: string;

  constructor(app: App, path: string, onResolve: (action: ExportConflictAction) => void) {
    super(app);
    this.path = path;
    this.onResolve = onResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h3', { text: 'File already exists' });
    contentEl.createEl('p', {
      text: `The file "${this.path}" already exists. Overwrite it or save as a new file?`,
    });

    const buttonRow = contentEl.createDiv({ cls: 'modal-button-container' });

    const overwriteBtn = buttonRow.createEl('button', {
      text: 'Overwrite',
      cls: 'mod-warning',
    });
    overwriteBtn.addEventListener('click', () => this.finish('overwrite'));

    const newFileBtn = buttonRow.createEl('button', {
      text: 'Save as new',
      cls: 'mod-cta',
    });
    newFileBtn.addEventListener('click', () => this.finish('new-file'));

    const cancelBtn = buttonRow.createEl('button', { text: 'Cancel' });
    cancelBtn.addEventListener('click', () => this.finish('cancel'));
  }

  onClose(): void {
    this.contentEl.empty();
    if (this.resolved) return;
    this.resolved = true;
    this.onResolve('cancel');
  }

  private finish(action: ExportConflictAction): void {
    if (this.resolved) return;
    this.resolved = true;
    this.onResolve(action);
    this.close();
  }
}

class PUMLViewerSettingTab extends PluginSettingTab {
  plugin: PUMLViewerPlugin;

  constructor(app: App, plugin: PUMLViewerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName('Plantuml viewer').setHeading();

    new Setting(containerEl)
      .setName('Server type')
      .setDesc('Choose which server URL to use for rendering.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('plantuml', 'Plantuml')
          .addOption('kroki', 'Kroki')
          .addOption('local', 'Local')
          .setValue(this.plugin.settings.serverType)
          .onChange(async (value) => {
            if (value !== 'plantuml' && value !== 'kroki' && value !== 'local') return;
            this.plugin.settings.serverType = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Plantuml server URL')
      .setDesc('Example: https://www.plantuml.com/plantuml')
      .addText((text) =>
        text
          .setPlaceholder('https://www.plantuml.com/plantuml')
          .setValue(this.plugin.settings.plantumlServerUrl)
          .onChange(async (value) => {
            this.plugin.settings.plantumlServerUrl = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Kroki URL')
      .setDesc('Example: https://kroki.io')
      .addText((text) =>
        text
          .setPlaceholder('https://kroki.io')
          .setValue(this.plugin.settings.krokiServerUrl)
          .onChange(async (value) => {
            this.plugin.settings.krokiServerUrl = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Kroki diagram type')
      .setDesc('Default diagram type for kroki requests outside explicit code block language.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('plantuml', 'Plantuml')
          .addOption('mermaid', 'Mermaid')
          .setValue(this.plugin.settings.krokiDiagramType)
          .onChange(async (value) => {
            if (value !== 'plantuml' && value !== 'mermaid') return;
            this.plugin.settings.krokiDiagramType = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Local URL')
      .setDesc('Use a local server URL.')
      .addText((text) =>
        text
          .setPlaceholder('Local server URL')
          .setValue(this.plugin.settings.localServerUrl)
          .onChange(async (value) => {
            this.plugin.settings.localServerUrl = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Image format')
      .setDesc('SVG is recommended.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('svg', 'SVG')
          .addOption('png', 'PNG')
          .setValue(this.plugin.settings.imageFormat)
          .onChange(async (value) => {
            if (value !== 'svg' && value !== 'png') return;
            this.plugin.settings.imageFormat = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Auto refresh')
      .setDesc('Automatically re-render diagram when the source file changes.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoRefresh).onChange(async (value) => {
          this.plugin.settings.autoRefresh = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Wrap long lines in editor')
      .setDesc('Wrap long lines in the code editor (edit and split modes) instead of scrolling horizontally.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.editorWordWrap).onChange(async (value) => {
          this.plugin.settings.editorWordWrap = value;
          await this.plugin.saveSettings();
          this.plugin.applyEditorWrapToOpenViews();
        }),
      );

    new Setting(containerEl)
      .setName('Split preview delay')
      .setDesc('Milliseconds to wait after typing stops before the split preview re-renders (150–5000).')
      .addText((text) =>
        text
          .setPlaceholder('800')
          .setValue(String(this.plugin.settings.previewDelayMs))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            if (!Number.isFinite(parsed)) return;
            this.plugin.settings.previewDelayMs = Math.min(5000, Math.max(150, parsed));
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Update split preview only on save')
      .setDesc('Do not send drafts to the render server while typing; re-render on save or refresh.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.previewOnSaveOnly).onChange(async (value) => {
          this.plugin.settings.previewOnSaveOnly = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Embedded block default view')
      .setDesc('Choose what to show first in embedded diagram blocks.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('diagram', 'Diagram')
          .addOption('code', 'Code')
          .setValue(this.plugin.settings.embeddedDefaultView)
          .onChange(async (value) => {
            if (value !== 'diagram' && value !== 'code') return;
            this.plugin.settings.embeddedDefaultView = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Embedded diagram alignment')
      .setDesc('Default alignment for diagrams in embedded diagram blocks.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('left', 'Left')
          .addOption('center', 'Center')
          .addOption('right', 'Right')
          .setValue(this.plugin.settings.embeddedDiagramAlign)
          .onChange(async (value) => {
            if (value !== 'left' && value !== 'center' && value !== 'right') return;
            this.plugin.settings.embeddedDiagramAlign = value;
            await this.plugin.saveSettings();
            this.plugin.rerenderMarkdownPreviews();
          }),
      );
  }
}
