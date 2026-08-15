# OpenCode Desktop MOD Loader Patch

This repository packages a Desktop MOD loader for OpenCode as a source patch. It
adds local MOD discovery, settings management, load priorities, conflict detection,
safe mode, sandboxed MOD pages, sidebar and command contributions, and opt-in trusted
host/server extension points.

The patch was created against OpenCode commit
`5e5cc924b8b1d1c5348309d2b23dbc59c72d27d2` (Desktop `1.18.10`).

## Install

This patch is for a source checkout of OpenCode. It does not patch an already
installed Desktop application.

1. Install Git and Bun.
2. Clone both repositories:

   ```powershell
   git clone https://github.com/UR-xiaoyang/opencode.git opencode
   git clone https://github.com/UR-xiaoyang/opencode-mod-loader.git opencode-mod-loader
   ```

3. Check out the exact base commit and apply the patch:

   ```powershell
   cd opencode
   git checkout 5e5cc924b8b1d1c5348309d2b23dbc59c72d27d2
   git apply --check ../opencode-mod-loader/patches/opencode-mod-loader.patch
   git apply ../opencode-mod-loader/patches/opencode-mod-loader.patch
   ```

4. Install dependencies, regenerate client code, verify types, and start Desktop:

   ```powershell
   bun install
   cd packages/client
   bun run generate
   cd ../desktop
   bun typecheck
   bun dev
   ```

5. In the Desktop app, open the command palette and run `Open MOD folder`. Copy
   a MOD folder into that location, then run `Refresh MODs` and enable it from
   `Settings > MODs`.

The patch includes `share-production-chats`, an example MOD. Its source folder is
`packages/desktop/mods/share-production-chats`; copy that folder into the MOD folder
opened by the app.

## MOD structure

Each MOD is a directory whose name matches the `id` in its `mod.json`:

```text
example.mod/
  mod.json
  index.html
```

See [MODS.md](docs/MODS.md) for the full manifest, permissions, contribution APIs,
conflict rules, and recovery instructions.

## Security

MOD pages are served from an isolated `oc-mod://` origin and receive only a narrow
storage/window API. Permissions such as `ui.host`, `server.host`, and
`server.database` deliberately execute trusted local code with much broader access.
Only enable MODs whose source you trust.

## Known baseline issue

At the target commit, `bun typecheck` in `packages/desktop` is currently blocked by
an existing syntax error in `packages/app/src/custom-elements.d.ts`. The same error
occurs before this patch is applied. The patch itself passes `git apply --check`, the
Desktop MOD manifest tests, and the OpenCode retry-hook tests.

## Updating

This is a patch against one specific OpenCode commit. Before applying it to a newer
OpenCode revision, run `git apply --check` first and resolve any reported conflicts.
