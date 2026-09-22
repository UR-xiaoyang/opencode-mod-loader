# OpenCode Desktop MOD Loader

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode](https://img.shields.io/badge/OpenCode-v1.18.32-green.svg)](https://github.com/anomalyco/opencode)
[![MOD Loader](https://img.shields.io/badge/MOD%20Loader-v0.3.9-orange.svg)](src/packages/desktop/src/main/mods.ts)

This repository contains the source overlay for the OpenCode Desktop MOD loader.
It intentionally does not vendor the full OpenCode repository.

The files under `src/` mirror only the OpenCode paths changed or added by the MOD
loader. `mod-loader.json` pins the upstream repository and base commit that the
overlay targets.

## ✨ Features

- **🔌 Extension System**: Load local MODs to extend OpenCode functionality
- **🛡️ Security**: Sandboxed MOD execution with granular permissions
- **🎨 UI Customization**: Add windows, sidebar panels, styles, and host scripts
- **⚙️ Server Plugins**: Hook into OpenCode server lifecycle and events
- **🔍 Diagnostics**: Real-time MOD debugging with SSE event stream
- **⚖️ Conflict Detection**: Automatic detection and priority-based resolution
- **📦 Simple Format**: JSON manifest with HTML/CSS/JS (no build required)

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
- `docs/AI_MOD_DEVELOPMENT.md`: a Chinese, task-oriented guide for AI agents to build MODs without reading the loader source.

## Releases

The release workflow checks out the pinned upstream base, copies the `src/` overlay,
generates `opencode-mod-loader.patch`, validates it with `git apply --check`, and
publishes the patch alongside the Windows installer and checksum.

`Build Desktop Packages` is a manual GitHub Actions workflow that produces Windows,
Linux (AppImage, DEB, RPM), and macOS (DMG, ZIP) installer artifacts from the same
overlay.

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or creating example MODs, your help is appreciated.

- **Read the guidelines**: See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions
- **Code of Conduct**: Follow our [Community Guidelines](COMMUNITY_GUIDELINES.md)
- **Security**: Report vulnerabilities via our [Security Policy](SECURITY.md)

### Quick Start for Contributors

1. **Report Bugs**: Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
2. **Request Features**: Open a [feature request](.github/ISSUE_TEMPLATE/feature_request.md)
3. **Submit MODs**: Share your MODs via [MOD submission](.github/ISSUE_TEMPLATE/mod_submission.md)
4. **Ask Questions**: Use [GitHub Discussions](https://github.com/UR-xiaoyang/opencode-mod-loader/discussions)

## 📚 Documentation

- **[MODS.md](src/packages/desktop/MODS.md)**: Complete MOD runtime specification
- **[AI_MOD_DEVELOPMENT.md](docs/AI_MOD_DEVELOPMENT.md)**: AI-assisted MOD development guide (Chinese)
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: How to contribute to this project
- **[SECURITY.md](SECURITY.md)**: Security policy and vulnerability reporting

## 🌟 Example MODs

This repository includes several example MODs to demonstrate capabilities:

- **[opencode.background-shell](src/packages/desktop/mods/opencode.background-shell)**: Run shell commands in background
- **[opencode.full-chain-trace](src/packages/desktop/mods/opencode.full-chain-trace)**: Full request/response tracing
- **[parallel-conversations](src/packages/desktop/mods/parallel-conversations)**: Agent Council with parallel deliberation
- **[share-production-chats](src/packages/desktop/mods/share-production-chats)**: Share database with production

## 📊 Project Status

- **Current Version**: 0.3.9
- **OpenCode Compatibility**: v1.18.32
- **Status**: Production Ready ✅

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to the [OpenCode](https://github.com/anomalyco/opencode) team for the excellent foundation
- Thanks to all [contributors](https://github.com/UR-xiaoyang/opencode-mod-loader/graphs/contributors) who have helped improve this project

## 💬 Community

- **Discussions**: [GitHub Discussions](https://github.com/UR-xiaoyang/opencode-mod-loader/discussions)
- **Issues**: [Issue Tracker](https://github.com/UR-xiaoyang/opencode-mod-loader/issues)
- **Security**: [Security Advisories](https://github.com/UR-xiaoyang/opencode-mod-loader/security/advisories)

---

Made with ❤️ by the OpenCode MOD Loader community
