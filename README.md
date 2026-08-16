# OpenCode Desktop MOD Loader

This repository contains the source overlay for the OpenCode Desktop MOD loader.
It intentionally does not vendor the full OpenCode repository.

The files under `src/` mirror only the OpenCode paths changed or added by the MOD
loader. `mod-loader.json` pins the upstream repository and base commit that the
overlay targets.

## Develop

Clone the upstream base and overlay this repository's sources:

```powershell
git clone https://github.com/UR-xiaoyang/opencode.git opencode
git clone https://github.com/UR-xiaoyang/opencode-mod-loader.git opencode-mod-loader
cd opencode
git checkout 5e5cc924b8b1d1c5348309d2b23dbc59c72d27d2
Copy-Item ../opencode-mod-loader/src/* . -Recurse -Force

bun install
cd packages/client
bun run generate
cd ../desktop
bun dev
```

## Source Layout

- `src/packages/app`: renderer integration, settings, sidebar, and trusted host MOD APIs.
- `src/packages/desktop`: MOD discovery, permissions, IPC, preload APIs, and example MODs.
- `src/packages/desktop/MODS.md`: manifest and MOD API documentation.

## Releases

The release workflow checks out the pinned upstream base, copies the `src/` overlay,
generates `opencode-mod-loader.patch`, validates it with `git apply --check`, and
publishes the patch alongside the Windows installer and checksum.

`Build Desktop Packages` is a manual GitHub Actions workflow that produces Windows,
Linux (AppImage, DEB, RPM), and macOS (DMG, ZIP) installer artifacts from the same
overlay.
