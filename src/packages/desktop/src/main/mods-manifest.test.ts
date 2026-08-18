import { describe, expect, test } from "bun:test"
import { findModConflicts, isModCompatible, parseModManifest, resolveModPath } from "./mods-manifest"

describe("MOD manifest", () => {
  test("accepts a minimal safe manifest", () => {
    expect(
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        permissions: ["storage"],
      }),
    ).toMatchObject({ id: "example.mod", permissions: ["storage"] })
  })

  test("rejects unsafe identifiers and permissions", () => {
    expect(() => parseModManifest({ id: "../bad", name: "Bad", version: "1", entry: "index.html" })).toThrow("id")
    expect(() =>
      parseModManifest({ id: "bad", name: "Bad", version: "1", entry: "index.html", permissions: ["filesystem"] }),
    ).toThrow("permissions")
  })

  test("requires explicit UI permissions for contributions", () => {
    expect(() =>
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        contributes: { sidebar: [{ id: "panel", title: "Panel", entry: "panel.html" }] },
      }),
    ).toThrow("ui.sidebar")
    expect(
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        permissions: ["ui.sidebar", "ui.command", "ui.style"],
        contributes: {
          sidebar: [{ id: "panel", title: "Panel", entry: "panel.html", order: 1 }],
          commands: [{ id: "open-panel", title: "Open panel", panel: "panel" }],
          styles: "theme.css",
        },
      }),
    ).toMatchObject({ contributes: { sidebar: [{ id: "panel" }], styles: "theme.css" } })
    expect(() =>
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        contributes: { host: "host.js" },
      }),
    ).toThrow("ui.host")
    expect(() =>
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        contributes: { server: "server.js" },
      }),
    ).toThrow("server.host")
    expect(() =>
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        contributes: { serverBootstrap: "bootstrap.js" },
      }),
    ).toThrow("server.host")
    expect(
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        permissions: ["server.host"],
        contributes: { server: "server.js" },
      }),
    ).toMatchObject({ contributes: { server: "server.js" } })
    expect(
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        permissions: ["server.host"],
        contributes: { serverBootstrap: "bootstrap.js" },
      }),
    ).toMatchObject({ contributes: { serverBootstrap: "bootstrap.js" } })
    expect(() =>
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        contributes: { database: { source: "production" } },
      }),
    ).toThrow("server.database")
    expect(
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        permissions: ["server.database"],
        contributes: { database: { source: "production" } },
      }),
    ).toMatchObject({ contributes: { database: { source: "production" } } })
  })

  test("bounds contribution counts before conflict indexing", () => {
    expect(() =>
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        permissions: ["ui.command"],
        contributes: {
          commands: Array.from({ length: 257 }, (_, index) => ({ id: `command-${index}`, title: "Command" })),
        },
      }),
    ).toThrow("256")
  })

  test("does not allow entry paths to escape a MOD folder", () => {
    expect(() => resolveModPath("C:\\mods\\example", "../outside.html")).toThrow("inside")
  })

  test("matches exact, compatible, and incompatible OpenCode versions", () => {
    expect(isModCompatible("^1.18.0", "1.19.0")).toBe(true)
    expect(isModCompatible("~1.18.0", "1.19.0")).toBe(false)
    expect(isModCompatible("1.18.0", "1.18.0")).toBe(true)
  })

  test("reports only overlapping declared contribution targets", () => {
    const candidate = parseModManifest({
      id: "candidate",
      name: "Candidate",
      version: "1.0.0",
      entry: "index.html",
      permissions: ["ui.sidebar", "ui.command", "ui.style", "ui.host", "server.host", "server.database"],
      contributes: {
        sidebar: [{ id: "notes", title: "Notes", entry: "notes.html" }],
        commands: [{ id: "open-notes", title: "Open notes" }],
        styles: "theme.css",
        host: "host.js",
        server: "server.js",
        serverBootstrap: "bootstrap.js",
        database: { source: "production" },
        overrides: [
          { type: "style", file: "src/menu.css", target: ".mods-menu > .label" },
          { type: "host", file: "src/menu.tsx", target: "mods-menu.label" },
        ],
      },
    })
    const existing = parseModManifest({
      ...candidate,
      id: "existing",
      name: "Existing",
    })

    expect(findModConflicts(candidate, existing)).toEqual([
      expect.objectContaining({ type: "sidebar", certain: true }),
      expect.objectContaining({ type: "command", certain: true }),
      expect.objectContaining({
        type: "style",
        certain: true,
        file: "src/menu.css",
        target: ".mods-menu > .label",
      }),
      expect.objectContaining({
        type: "host",
        certain: true,
        file: "src/menu.tsx",
        target: "mods-menu.label",
      }),
    ])
  })

  test("does not report two overrides in different locations of the same file", () => {
    const base = {
      version: "1.0.0",
      entry: "index.html",
      permissions: ["ui.host"],
      contributes: {
        host: "host.js",
        overrides: [{ type: "host", file: "src/menu.tsx", target: "mods-menu.label" }],
      },
    }
    const candidate = parseModManifest({ ...base, id: "candidate", name: "Candidate" })
    const existing = parseModManifest({
      ...base,
      id: "existing",
      name: "Existing",
      contributes: {
        host: "host.js",
        overrides: [{ type: "host", file: "src/menu.tsx", target: "settings-menu.label" }],
      },
    })
    expect(findModConflicts(candidate, existing)).toEqual([])
  })

  test("requires override contributions to match a declared contribution", () => {
    expect(() =>
      parseModManifest({
        id: "example.mod",
        name: "Example MOD",
        version: "1.0.0",
        entry: "index.html",
        permissions: ["ui.host"],
        contributes: {
          overrides: [{ type: "host", file: "src/menu.tsx", target: "mods-menu.label" }],
        },
      }),
    ).toThrow("same type")
  })
})
