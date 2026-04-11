# Release Guide (Community Plugins)

This project is prepared for release `0.2.4`.

## 1) Build

```bash
npm install
npm run build
```

Release assets that must be attached to GitHub Release:
- `main.js`
- `manifest.json`
- `styles.css`

## 2) Push and tag

```bash
git add .
git commit -m "release: 0.2.4"
git tag -a 0.2.4 -m "0.2.4"
git push origin main --tags
```

Important:
- Tag name must exactly match `manifest.json` version (`0.2.4`).

## 3) Create GitHub Release

- Create release from tag `0.2.4`.
- Upload assets:
  - `main.js`
  - `manifest.json`
  - `styles.css`

## 4) Submit to Obsidian Community Plugins

Open PR to:
- `https://github.com/obsidianmd/obsidian-releases`

Add this entry to `community-plugins.json`:

```json
{
  "id": "puml-viewer",
  "name": "PUML Viewer",
  "author": "Andrei Kolygin",
  "description": "Renders PlantUML from .puml files and markdown code blocks.",
  "repo": "https://github.com/<your-user>/<your-repo>"
}
```

Replace:
- `<your-user>/<your-repo>` with your real public repository path.

## 5) Verify before PR

- Repository is public.
- `manifest.json` has:
  - stable `id` (`puml-viewer`)
  - `version` matching release tag (`0.2.4`)
  - correct `minAppVersion`
- `versions.json` is valid JSON.
- `README.md` describes usage/settings.
- `LICENSE` exists.
