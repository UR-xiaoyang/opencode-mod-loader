# Contributing to OpenCode MOD Loader

Thank you for your interest in contributing to the OpenCode MOD Loader project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)

## Code of Conduct

This project adheres to the guidelines in [COMMUNITY_GUIDELINES.md](COMMUNITY_GUIDELINES.md). By participating, you are expected to uphold these standards.

## Getting Started

### Prerequisites

- **Git**: Version control
- **Bun**: Package manager and runtime (or Node.js v18+)
- **Windows/macOS/Linux**: For testing
- **OpenCode Desktop**: Latest version from upstream

### Understanding the Architecture

This is an **overlay repository** that patches OpenCode Desktop to add MOD loading capabilities:

```
opencode-mod-loader/
├── src/                    # Overlay files (mirror OpenCode paths)
│   ├── packages/app/       # Renderer UI integration
│   ├── packages/desktop/   # MOD loader core
│   └── packages/opencode/  # Session layer patches
├── mod-loader.json         # Pins upstream commit
└── docs/                   # Additional documentation
```

Read [README.md](README.md) to understand the overlay approach.

## Development Setup

### 1. Clone Repositories

```bash
# Clone upstream OpenCode
git clone https://github.com/UR-xiaoyang/opencode.git opencode
cd opencode

# Checkout pinned commit
git checkout fe3f3a41f79ad292cc3c7c629567385a20ec5130

# Clone MOD loader overlay
cd ..
git clone https://github.com/UR-xiaoyang/opencode-mod-loader.git
cd opencode-mod-loader
```

### 2. Apply Overlay

```bash
# Copy overlay files to OpenCode
cp -r src/* ../opencode/

cd ../opencode
```

### 3. Install Dependencies

```bash
bun install
cd packages/client
bun run generate
cd ../desktop
```

### 4. Run Development Build

```bash
bun dev
```

OpenCode Desktop will launch with MOD loading enabled.

### 5. Test MOD Loading

1. Open Settings → MODs → Open folder
2. Create a test MOD in the opened folder
3. Refresh MOD list in Settings
4. Enable your MOD and test

## How to Contribute

### Reporting Bugs

1. **Check existing issues** first to avoid duplicates
2. Use the bug report template
3. Include:
   - OpenCode version
   - MOD Loader version (from `src/packages/desktop/src/main/mods.ts`)
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs (Settings → MODs → Export debug logs)

### Suggesting Features

1. **Search Discussions** to see if it's been proposed
2. Open a Discussion (not an Issue) to discuss the idea
3. If consensus is reached, create a Feature Request issue
4. Consider if it should be:
   - **Core MOD Loader feature**: Affects all MODs
   - **Example MOD**: Demonstrates capability
   - **Documentation**: Helps MOD developers

### Contributing Code

#### Small Changes (typos, docs, minor fixes)
1. Fork the repository
2. Create a branch: `git checkout -b fix/typo-in-readme`
3. Make your changes
4. Submit a pull request

#### Larger Changes (features, refactoring)
1. **Discuss first** in an issue or Discussion
2. Get maintainer approval before investing time
3. Fork and create a feature branch
4. Implement with tests and documentation
5. Submit a pull request

## Coding Standards

### TypeScript

```typescript
// Use strict mode
"use strict"

// Prefer const over let
const maxRetries = 3

// Use meaningful names
function validateModManifest(manifest: ModManifest): boolean { }

// Document complex logic
/**
 * Resolves MOD conflicts by checking patch range overlaps.
 * Returns true if changes overlap, considering add operations
 * as zero-width insertions at a specific line.
 */
function changesOverlap(left: ModOverrideChange, right: ModOverrideChange): boolean { }
```

### File Organization

```
src/packages/desktop/src/main/
├── mods.ts              # Core MOD manager
├── mods-manifest.ts     # Manifest parsing and validation
├── mods-manifest.test.ts # Tests for manifest logic
└── mods-debug-listener.ts # SSE diagnostic endpoint
```

- One feature per file
- Co-locate tests with implementation
- Keep files under 600 lines

### Error Handling

```typescript
// Provide helpful error messages
if (!manifest.id) {
  throw new Error("Manifest must include an 'id' field")
}

// Use specific error types when appropriate
class ModLoadError extends Error {
  constructor(modId: string, cause: string) {
    super(`Failed to load MOD "${modId}": ${cause}`)
    this.name = "ModLoadError"
  }
}

// Log errors with context
console.error("[mod-loader]", "Failed to parse manifest", { path, error })
```

### Security Best Practices

```typescript
// Validate and sanitize inputs
function resolveModPath(root: string, input: string): string {
  const file = resolve(root, `.${input.startsWith("/") ? input : `/${input}`}`)
  const path = relative(root, file)
  if (path.startsWith("..") || isAbsolute(path)) {
    throw new Error("Path must stay inside the MOD directory")
  }
  return file
}

// Never trust MOD content
const userMessage = event.data.message
reportDiagnostic(id, phase, status, String(userMessage).slice(0, 1000))

// Use CSP for MOD pages
headers.set("Content-Security-Policy",
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ...")
```

## Testing Guidelines

### Writing Tests

```typescript
// mods-manifest.test.ts
import { describe, test, expect } from "bun:test"
import { parseModManifest, isModCompatible } from "./mods-manifest"

describe("parseModManifest", () => {
  test("rejects manifest without id", () => {
    expect(() => parseModManifest({ name: "Test" })).toThrow(/id/)
  })

  test("accepts valid minimal manifest", () => {
    const manifest = parseModManifest({
      id: "test.mod",
      name: "Test MOD",
      version: "1.0.0",
      permissions: [],
      entry: "index.html"
    })
    expect(manifest.id).toBe("test.mod")
  })
})

describe("isModCompatible", () => {
  test("caret range matches compatible versions", () => {
    expect(isModCompatible("^1.18.0", "1.18.32")).toBe(true)
    expect(isModCompatible("^1.18.0", "2.0.0")).toBe(false)
  })
})
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/packages/desktop/src/main/mods-manifest.test.ts

# Watch mode
bun test --watch
```

### Manual Testing Checklist

Before submitting a PR that affects MOD loading:

- [ ] Create a test MOD and verify it loads
- [ ] Test enabling/disabling the MOD
- [ ] Test priority changes (if applicable)
- [ ] Verify diagnostic messages appear correctly
- [ ] Test on Windows (if available)
- [ ] Test on macOS (if available)
- [ ] Test on Linux (if available)
- [ ] Check that Safe Mode disables the MOD
- [ ] Verify no console errors in DevTools

## Documentation

### Code Comments

```typescript
// Good: Explains WHY, not WHAT
// Rebuild conflict index because priorities may have changed,
// affecting which MOD loads last and owns overlapping changes
rebuildConflictIndex()

// Bad: Obvious from code
// Set enabled to true
setEnabled(id, true)
```

### Documentation Files

- **MODS.md**: Runtime specification for MOD developers
- **AI_MOD_DEVELOPMENT.md**: Task-oriented guide for AI-assisted development
- **README.md**: Project overview and development setup
- **COMMUNITY_GUIDELINES.md**: Community rules and expectations

When adding features, update relevant documentation in the same PR.

### Commit Messages

Follow Conventional Commits:

```bash
# Format: <type>(<scope>): <description>

feat(mods): add hot reload support for MOD windows
fix(manifest): validate sidebar contribution IDs
docs(readme): add troubleshooting section
test(mods): add conflict detection tests
chore(deps): update bun to 1.0.20
```

Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`, `style`

## Submitting Changes

### Pull Request Checklist

Before submitting:

- [ ] Code follows project style and conventions
- [ ] All tests pass (`bun test`)
- [ ] New features have tests
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is rebased on latest `main`
- [ ] No unnecessary files committed (build artifacts, IDE configs)

### Pull Request Template

```markdown
## Description
Brief description of what this PR does.

## Motivation
Why is this change needed? What problem does it solve?

## Changes
- List of specific changes made

## Testing
How was this tested? Include steps to reproduce.

## Screenshots (if applicable)
For UI changes, include before/after screenshots.

## Breaking Changes
List any breaking changes and migration notes.

## Related Issues
Fixes #123
Related to #456
```

### PR Size Guidelines

- **Small**: < 100 lines changed (docs, small fixes)
- **Medium**: 100-400 lines changed (feature additions)
- **Large**: > 400 lines (refactoring, major features)

Large PRs should be split into smaller, reviewable chunks when possible.

## Review Process

### What Reviewers Look For

1. **Correctness**: Does it solve the stated problem?
2. **Security**: Are inputs validated? Are permissions checked?
3. **Performance**: Any unnecessary loops or blocking operations?
4. **Maintainability**: Is the code readable and well-structured?
5. **Testing**: Are edge cases covered?
6. **Documentation**: Are changes documented?

### Responding to Feedback

- Address each comment or explain why you disagree
- Push new commits instead of force-pushing during review
- Mark conversations as resolved once addressed
- Be open to alternative approaches

### After Approval

1. Squash commits if requested by maintainer
2. Ensure CI passes
3. Maintainer will merge when ready
4. Your changes will be in the next release

## Release Process

Releases follow this schedule:

- **Patch releases**: As needed for critical bugs
- **Minor releases**: Monthly, with new features
- **Major releases**: When breaking changes accumulate

Your contribution will be credited in release notes.

## Getting Help

- **Questions**: Use GitHub Discussions
- **Stuck**: Comment on your PR or issue
- **Security issues**: Email maintainers privately
- **General chat**: Open a Discussion thread

## Recognition

Contributors are recognized through:
- Credits in release notes
- Mention in README contributors section
- GitHub contributor badge

Significant contributions may earn:
- Triage permissions (help with issue management)
- Review permissions (review other PRs)
- Maintainer role (for consistent, high-quality contributors)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to OpenCode MOD Loader! 🎉
