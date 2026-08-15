# Applying To A Newer OpenCode Revision

The release patch targets OpenCode commit
`5e5cc924b8b1d1c5348309d2b23dbc59c72d27d2`. It may not apply cleanly to later
revisions.

```powershell
git apply --check ../opencode-mod-loader/patches/opencode-mod-loader.patch
```

If this command reports conflicts, apply the patch in a dedicated branch and resolve
the affected files manually. Then regenerate client code from `packages/client`:

```powershell
bun run generate
```

Finally verify the affected package:

```powershell
cd ../desktop
bun typecheck
```
