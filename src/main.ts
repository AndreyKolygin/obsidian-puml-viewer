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
  requestUrl,
} from 'obsidian';
import { encode } from 'plantuml-encoder';

const VIEW_TYPE_PUML = 'puml-viewer';
const encodePlantuml = encode;
const CSS_AUTO = 'auto';
const CSS_NONE = 'none';

type ViewMode = 'view' | 'edit';
type DiagramFormat = 'svg' | 'png' | 'txt';
type ExportConflictAction = 'overwrite' | 'new-file' | 'cancel';

interface PUMLViewerSettings {
  serverType: 'plantuml' | 'kroki' | 'local';
  plantumlServerUrl: string;
  krokiServerUrl: string;
  localServerUrl: string;
  imageFormat: 'svg' | 'png';
  autoRefresh: boolean;
  lastOpenedPumlPath: string;
  embeddedDefaultView: 'diagram' | 'code';
  embeddedDiagramAlign: 'left' | 'center' | 'right';
}

const DEFAULT_SETTINGS: PUMLViewerSettings = {
  serverType: 'plantuml',
  plantumlServerUrl: 'https://www.plantuml.com/plantuml',
  krokiServerUrl: 'https://kroki.io',
  localServerUrl: 'http://localhost:8000',
  imageFormat: 'svg',
  autoRefresh: true,
  lastOpenedPumlPath: '',
  embeddedDefaultView: 'diagram',
  embeddedDiagramAlign: 'center',
};

interface PUMLViewState extends Record<string, unknown> {
  file?: string;
  mode?: ViewMode;
}

function parseSvgLength(value: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

  // Keep diagram geometry responsive when container width is constrained.
  if (!svgEl.getAttribute('preserveAspectRatio')) {
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  // Fixed root dimensions can force stretching when CSS constrains only width.
  svgEl.removeAttribute('width');
  svgEl.removeAttribute('height');
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
    this.registerExtensions(['puml'], VIEW_TYPE_PUML);

    this.addCommand({
      id: 'open-current-puml-in-viewer',
      name: 'Open current plantuml file in viewer',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        const canOpen = !!file && file.extension === 'puml';

        if (canOpen && !checking && file) {
          void this.activatePUMLView(file);
        }

        return canOpen;
      },
    });

    this.app.workspace.onLayoutReady(() => {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile?.extension !== 'puml') return;

      const activeLeaf = this.app.workspace.getMostRecentLeaf();
      if (activeLeaf?.view.getViewType() === VIEW_TYPE_PUML) return;

      void this.activatePUMLView(activeFile);
    });

    for (const lang of ['plantuml']) {
      this.registerMarkdownCodeBlockProcessor(lang, async (source, el, ctx) => {
        const fenceWidthHintPx = this.extractFenceWidthHint(
          ctx.getSectionInfo(el)?.text ?? '',
          source,
        );
        await this.renderEmbeddedDiagramBlock(source, el, fenceWidthHintPx);
      });
    }

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

  buildRenderUrl(source: string): string {
    const normalizedBase = this.getActiveServerUrl().replace(/\/+$/, '');
    const encoded = encodePlantuml(source);
    const format = this.settings.imageFormat;

    if (this.settings.serverType === 'kroki') {
      return `${normalizedBase}/plantuml/${format}/${encoded}`;
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

  async requestDiagram(source: string, format: DiagramFormat) {
    const normalizedBase = this.normalizedServerBase();

    if (this.settings.serverType === 'kroki') {
      const accept =
        format === 'svg' ? 'image/svg+xml' : format === 'png' ? 'image/png' : 'text/plain';
      return requestUrl({
        url: `${normalizedBase}/plantuml/${format}`,
        method: 'POST',
        body: source,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          Accept: accept,
        },
        throw: false,
      });
    }

    const encoded = encodePlantuml(source);
    return requestUrl({
      url: `${normalizedBase}/${format}/${encoded}`,
      method: 'GET',
      throw: false,
    });
  }

  async fetchPngObjectUrl(source: string): Promise<string> {
    const response = await this.requestDiagram(source, 'png');
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

  async downloadDiagramAs(source: string, format: 'svg' | 'png', baseName = 'diagram'): Promise<void> {
    const response = await this.requestDiagram(source, format);
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

  async downloadDiagram(source: string, baseName = 'diagram'): Promise<void> {
    await this.downloadDiagramAs(source, this.settings.imageFormat, baseName);
  }

  private async renderEmbeddedDiagramBlock(
    source: string,
    el: HTMLElement,
    fenceWidthHintPx: number | null,
  ): Promise<void> {
    const { renderSource, widthHintPx } = this.extractEmbeddedWidthHint(source, fenceWidthHintPx);

    const container = el.createDiv({ cls: 'puml-embed-block' });
    const actionsEl = container.createDiv({ cls: 'puml-embed-actions' });
    const toggleBtn = actionsEl.createEl('button', { cls: 'puml-embed-toggle' });
    const zoomBtn = actionsEl.createEl('button', { cls: 'puml-embed-zoom-btn', text: 'Zoom' });
    const saveBtn = actionsEl.createEl('button', { cls: 'puml-embed-save-btn', text: 'Save' });
    const copyBtn = actionsEl.createEl('button', { cls: 'puml-embed-copy-btn', text: 'Copy' });
    toggleBtn.setAttr('aria-label', 'Toggle code and diagram');
    zoomBtn.setAttr('aria-label', 'Open zoom overlay');
    saveBtn.setAttr('aria-label', 'Save image');
    copyBtn.setAttr('aria-label', 'Copy code');
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
      this.renderPlantUmlHighlightedLine(lineEl, line);
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
        saveBtn.addClass('is-hidden');
        copyBtn.removeClass('is-hidden');
      } else {
        codePane.hide();
        diagramPane.show();
        toggleBtn.setText('Code');
        toggleBtn.setAttr('aria-label', 'Show code');
        zoomBtn.removeClass('is-hidden');
        saveBtn.removeClass('is-hidden');
        copyBtn.addClass('is-hidden');
      }
    };

    toggleBtn.addEventListener('click', () => {
      showCode = !showCode;
      applyToggleState();
    });
    applyToggleState();

    if (!renderSource.trim()) {
      diagramPane.createDiv({ cls: 'puml-embed-error', text: 'PlantUML block is empty.' });
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
          const response = await this.requestDiagram(renderSource, 'svg');

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
          img.alt = 'PlantUML diagram';
          const objectUrl = await this.fetchPngObjectUrl(renderSource);
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
            await this.downloadDiagramAs(renderSource, 'png', 'plantuml-diagram');
            new Notice('Diagram saved as PNG');
          } catch (error) {
            new Notice(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        }),
      );
      menu.addItem((item) =>
        item.setTitle('Save as SVG').onClick(async () => {
          try {
            await this.downloadDiagramAs(renderSource, 'svg', 'plantuml-diagram');
            new Notice('Diagram saved as SVG');
          } catch (error) {
            new Notice(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        }),
      );
      menu.showAtMouseEvent(event);
    });
    copyBtn.addEventListener('click', () => {
      void (async () => {
        try {
          await navigator.clipboard.writeText(renderSource);
          new Notice('Plantuml code copied.');
        } catch (error) {
          new Notice(`Copy failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      })();
    });

    const loadingEl = diagramPane.createDiv({ cls: 'puml-loading', text: 'Generating diagram...' });
    try {
      if (this.settings.imageFormat === 'svg') {
        const response = await this.requestDiagram(renderSource, 'svg');

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
        const objectUrl = await this.fetchPngObjectUrl(renderSource);
        img.src = objectUrl;
        img.alt = 'PlantUML diagram';
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

  private extractFenceWidthHint(sectionText: string, source: string): number | null {
    const regex = /`{3,}\s*plantuml(?:\s+\|(\d{2,4}))?\s*\n([\s\S]*?)`{3,}/gi;
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

  private renderPlantUmlHighlightedLine(target: HTMLElement, line: string): void {
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
  private saveBtn!: HTMLButtonElement;
  private zoomOutBtn!: HTMLButtonElement;
  private zoomResetBtn!: HTMLButtonElement;
  private zoomInBtn!: HTMLButtonElement;
  private exportPngBtn!: HTMLButtonElement;
  private exportSvgBtn!: HTMLButtonElement;
  private exportAsciiBtn!: HTMLButtonElement;
  private editorGutterEl: HTMLDivElement | null = null;
  private editorEl: HTMLTextAreaElement | null = null;
  private editorDraft: string | null = null;
  private draftFilePath: string | null = null;
  private isDirty = false;
  private isMainPanning = false;
  private mainPanStartX = 0;
  private mainPanStartY = 0;
  private mainPanScrollLeft = 0;
  private mainPanScrollTop = 0;

  constructor(leaf: WorkspaceLeaf, plugin: PUMLViewerPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_PUML;
  }

  getDisplayText(): string {
    return this.currentFile ? `PUML: ${this.currentFile.name}` : 'PUML Viewer';
  }

  getIcon(): string {
    return 'git-branch-plus';
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
          await this.reloadEditorFromFile();
          this.statusEl.setText(`Updated from disk: ${this.currentFile.name}`);
        } else {
          this.statusEl.setText('File changed on disk. Unsaved editor changes are kept.');
        }
      }),
    );
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
    if (mode === 'view' || mode === 'edit') {
      this.mode = mode;
      this.updateToolbarState();
    }

    const candidates: string[] = [];
    if (typeof state?.file === 'string') candidates.push(state.file);

    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile?.extension === 'puml') candidates.push(activeFile.path);

    if (this.plugin.settings.lastOpenedPumlPath) {
      candidates.push(this.plugin.settings.lastOpenedPumlPath);
    }

    const workspaceAny = this.app.workspace as unknown as { getLastOpenFiles?: () => string[] };
    const lastOpenFiles = workspaceAny.getLastOpenFiles?.() ?? [];
    for (const path of lastOpenFiles) {
      if (path.endsWith('.puml')) candidates.push(path);
    }

    const tried = new Set<string>();
    for (const path of candidates) {
      if (!path || tried.has(path)) continue;
      tried.add(path);
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile && file.extension === 'puml') {
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
      !this.exportAsciiBtn
    )
      return;

    this.viewModeBtn.toggleClass('is-active', this.mode === 'view');
    this.editModeBtn.toggleClass('is-active', this.mode === 'edit');
    this.saveBtn.disabled = this.mode !== 'edit';
    const zoomDisabled = this.mode !== 'view';
    this.zoomOutBtn.disabled = zoomDisabled;
    this.zoomResetBtn.disabled = zoomDisabled;
    this.zoomInBtn.disabled = zoomDisabled;
    const exportDisabled = zoomDisabled || !this.currentFile;
    this.exportPngBtn.disabled = exportDisabled;
    this.exportSvgBtn.disabled = exportDisabled;
    this.exportAsciiBtn.disabled = exportDisabled;
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

  private async renderEditor(): Promise<void> {
    this.contentHostEl.empty();
    this.contentHostEl.addClass('puml-viewer-content-host--editor');
    this.contentHostEl.removeClass('puml-viewer-content-host--view');
    this.imageWrapEl.removeClass('puml-viewer-image-wrap--view');
    this.imageWrapEl.removeClass('is-pan-enabled');
    this.imageWrapEl.removeClass('is-panning');
    this.isMainPanning = false;

    if (!this.currentFile) {
      this.statusEl.setText('No .puml file selected.');
      return;
    }

    try {
      const initialText =
        this.draftFilePath === this.currentFile.path && this.editorDraft !== null
          ? this.editorDraft
          : await this.app.vault.read(this.currentFile);

      this.editorDraft = initialText;
      this.draftFilePath = this.currentFile.path;

      const editorShell = this.contentHostEl.createDiv({ cls: 'puml-viewer-editor-shell' });
      this.editorGutterEl = editorShell.createDiv({ cls: 'puml-viewer-editor-gutter' });
      this.editorEl = editorShell.createEl('textarea', { cls: 'puml-viewer-editor' });
      this.editorEl.value = initialText;
      this.updateEditorLineNumbers(initialText);
      this.editorEl.addEventListener('input', () => {
        if (!this.editorEl) return;
        this.editorDraft = this.editorEl.value;
        this.isDirty = true;
        this.updateEditorLineNumbers(this.editorEl.value);
        this.statusEl.setText(`Editing: ${this.currentFile?.name ?? ''} (unsaved)`);
      });
      this.editorEl.addEventListener('scroll', () => {
        if (!this.editorEl || !this.editorGutterEl) return;
        this.editorGutterEl.scrollTop = this.editorEl.scrollTop;
      });
      this.editorEl.addEventListener('keydown', (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          void this.saveEditor();
        }
      });

      this.statusEl.setText(`Editing: ${this.currentFile.name}`);
    } catch (error) {
      console.error(error);
      this.statusEl.setText('Failed to open editor.');

      const errorEl = this.contentHostEl.createDiv({ cls: 'puml-viewer-error' });
      errorEl.setText(
        `Failed to load source text.\n\n${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async reloadEditorFromFile(): Promise<void> {
    if (!this.currentFile || !this.editorEl) return;

    try {
      const source = await this.app.vault.read(this.currentFile);
      this.editorDraft = source;
      this.draftFilePath = this.currentFile.path;
      this.editorEl.value = source;
      this.updateEditorLineNumbers(source);
      this.isDirty = false;
    } catch (error) {
      console.error(error);
      this.statusEl.setText('Failed to reload source.');
    }
  }

  private async saveEditor(): Promise<void> {
    if (!this.currentFile || !this.editorEl || this.mode !== 'edit') return;

    try {
      const text = this.editorEl.value;
      await this.app.vault.modify(this.currentFile, text);
      this.editorDraft = text;
      this.draftFilePath = this.currentFile.path;
      this.isDirty = false;
      this.statusEl.setText(`Saved: ${this.currentFile.name}`);
      new Notice('Plantuml source saved.');
    } catch (error) {
      console.error(error);
      this.statusEl.setText('Save failed.');
      new Notice('Failed to save plantuml source.');
    }
  }

  private async exportDiagram(format: DiagramFormat): Promise<void> {
    if (this.mode !== 'view' || !this.currentFile) return;

    try {
      const source = await this.app.vault.read(this.currentFile);
      if (!source.trim()) {
        new Notice('Plantuml file is empty.');
        return;
      }

      const defaultOutputPath = normalizePath(
        this.currentFile.path.replace(/\.puml$/i, `.${format}`),
      );
      const outputPath = await this.resolveExportOutputPath(defaultOutputPath);
      if (!outputPath) {
        this.statusEl.setText('Export cancelled.');
        return;
      }

      const response = await this.plugin.requestDiagram(source, format);

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

  private async resolveExportOutputPath(defaultPath: string): Promise<string | null> {
    const existing = this.app.vault.getAbstractFileByPath(defaultPath);
    if (!existing) return defaultPath;

    if (!(existing instanceof TFile)) {
      return this.getNextAvailableExportPath(defaultPath);
    }

    const action = await this.askExportConflict(defaultPath);
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

  private askExportConflict(path: string): Promise<ExportConflictAction> {
    return new Promise((resolve) => {
      const modal = new ExportConflictModal(this.app, path, resolve);
      modal.open();
    });
  }

  private async renderDiagram(): Promise<void> {
    this.contentHostEl.empty();
    this.contentHostEl.removeClass('puml-viewer-content-host--editor');
    this.contentHostEl.addClass('puml-viewer-content-host--view');
    this.imageWrapEl.addClass('puml-viewer-image-wrap--view');
    this.editorGutterEl = null;
    this.editorEl = null;

    if (!this.currentFile) {
      this.statusEl.setText('No .puml file selected.');
      return;
    }

    try {
      const source = await this.app.vault.read(this.currentFile);

      if (!source.trim()) {
        this.statusEl.setText('File is empty.');
        return;
      }

      this.statusEl.setText(`Rendering: ${this.currentFile.name}`);
      const renderRoot = this.contentHostEl.createDiv({ cls: 'puml-viewer-render-root' });
      const loadingEl = renderRoot.createDiv({ cls: 'puml-loading', text: 'Generating diagram...' });

      if (this.plugin.settings.imageFormat === 'svg') {
        const response = await this.plugin.requestDiagram(source, 'svg');

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        const contentType = this.plugin.responseContentType(response);
        if (contentType && !contentType.includes('image/svg')) {
          throw new Error(
            `Expected SVG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`,
          );
        }
        if (!response.text.includes('<svg')) {
          throw new Error('Response is not SVG content.');
        }

        loadingEl.remove();
        const svgHost = renderRoot.createDiv();
        const svgEl = parseSvgMarkup(response.text);
        if (!svgEl) {
          throw new Error('Response is not valid SVG content.');
        }
        svgHost.appendChild(svgEl);
      } else {
        const img = renderRoot.createEl('img', {
          cls: 'puml-viewer-image puml-is-hidden',
        });
        const objectUrl = await this.plugin.fetchPngObjectUrl(source);
        img.src = objectUrl;
        img.alt = this.currentFile.name;
        img.addEventListener(
          'load',
          () => {
            loadingEl.remove();
            img.removeClass('puml-is-hidden');
            this.statusEl.setText(`Rendered: ${this.currentFile?.name ?? ''}`);
            URL.revokeObjectURL(objectUrl);
          },
          { once: true },
        );
        img.addEventListener(
          'error',
          () => {
            loadingEl.remove();
            this.statusEl.setText('Render failed.');
            const errorEl = renderRoot.createDiv({ cls: 'puml-viewer-error' });
            errorEl.setText('Failed to load PNG diagram.');
            URL.revokeObjectURL(objectUrl);
          },
          { once: true },
        );
      }

      this.fitToWidth();
      this.refreshMainPanAvailability();
      if (this.plugin.settings.imageFormat === 'svg') {
        this.statusEl.setText(`Rendered: ${this.currentFile.name}`);
      }
    } catch (error) {
      console.error(error);
      this.statusEl.setText('Render failed.');

      const errorEl = this.contentHostEl.createDiv({ cls: 'puml-viewer-error' });
      errorEl.setText(
        `Failed to render diagram.\n\n${error instanceof Error ? error.message : String(error)}`,
      );

      new Notice('Plantuml render failed.');
    }
  }

  private setZoom(value: number): void {
    const nextZoom = Math.min(4, Math.max(0.25, Math.round(value * 100) / 100));
    this.zoom = nextZoom;
    this.applyZoom();
    this.refreshMainPanAvailability();
    this.updateZoomLabel();
  }

  private fitToWidth(): void {
    const renderRoot = this.contentHostEl?.querySelector<HTMLElement>('.puml-viewer-render-root');
    if (!renderRoot || !this.imageWrapEl) return;

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

      const availableWidth = Math.max(1, this.imageWrapEl.clientWidth - 24);
      this.setZoom(Math.min(1, availableWidth / baseWidth));
      return;
    }

    const svgEl = renderRoot.querySelector<SVGSVGElement>('svg');
    if (!svgEl) return;

    const baseWidth = this.getSvgBaseWidth(svgEl);
    if (!(baseWidth > 0)) return;

    const availableWidth = Math.max(1, this.imageWrapEl.clientWidth - 24);
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
      if (this.mode !== 'view') return;
      if (!this.canMainPan()) return;

      this.isMainPanning = true;
      this.mainPanStartX = event.clientX;
      this.mainPanStartY = event.clientY;
      this.mainPanScrollLeft = this.imageWrapEl.scrollLeft;
      this.mainPanScrollTop = this.imageWrapEl.scrollTop;
      this.imageWrapEl.addClass('is-panning');
      event.preventDefault();
    });

    this.registerDomEvent(window, 'mousemove', (event: MouseEvent) => {
      if (!this.isMainPanning) return;
      const dx = event.clientX - this.mainPanStartX;
      const dy = event.clientY - this.mainPanStartY;
      this.imageWrapEl.scrollLeft = this.mainPanScrollLeft - dx;
      this.imageWrapEl.scrollTop = this.mainPanScrollTop - dy;
      event.preventDefault();
    });

    const stopPanning = () => {
      if (!this.isMainPanning) return;
      this.isMainPanning = false;
      this.imageWrapEl.removeClass('is-panning');
    };

    this.registerDomEvent(window, 'mouseup', stopPanning);
    this.registerDomEvent(this.imageWrapEl, 'mouseleave', stopPanning);
  }

  private canMainPan(): boolean {
    const hasHorizontal = this.imageWrapEl.scrollWidth > this.imageWrapEl.clientWidth + 1;
    const hasVertical = this.imageWrapEl.scrollHeight > this.imageWrapEl.clientHeight + 1;
    return hasHorizontal || hasVertical;
  }

  private refreshMainPanAvailability(): void {
    if (this.mode !== 'view') {
      this.imageWrapEl.removeClass('is-pan-enabled');
      return;
    }
    this.imageWrapEl.toggleClass('is-pan-enabled', this.canMainPan());
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
      .setDesc('Automatically re-render diagram when the .puml file changes.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoRefresh).onChange(async (value) => {
          this.plugin.settings.autoRefresh = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Embedded block default view')
      .setDesc('Choose what to show first in embedded plantuml blocks.')
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
      .setDesc('Default alignment for diagrams in embedded plantuml blocks.')
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
