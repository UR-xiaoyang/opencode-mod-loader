import { isAbsolute, relative, resolve } from "node:path"

export const MOD_PERMISSIONS = [
  "storage",
  "external.open",
  "ui.sidebar",
  "ui.command",
  "ui.style",
  "ui.host",
  "server.host",
  "server.database",
] as const

export type ModPermission = (typeof MOD_PERMISSIONS)[number]

export type ModSidebarContribution = {
  id: string
  title: string
  entry: string
  order?: number
}

export type ModCommandContribution = {
  id: string
  title: string
  description?: string
  panel?: string
}

export type ModDatabaseContribution = {
  source: "production"
}

export type ModOverrideContribution = {
  type: "style" | "host" | "server" | "server-bootstrap"
  file: string
  /**
   * Legacy symbolic location. New MODs should declare base and changes so
   * conflicts can be checked using actual source ranges.
   */
  target?: string
  base?: string
  changes?: ModOverrideChange[]
}

export type ModOverrideChange = {
  operation: "add" | "modify" | "delete"
  start: number
  end: number
  content?: string
}

export type ModManifest = {
  id: string
  name: string
  version: string
  description?: string
  engines?: {
    opencode?: string
  }
  permissions: ModPermission[]
  entry: string
  window?: {
    width?: number
    height?: number
  }
  contributes?: {
    sidebar?: ModSidebarContribution[]
    commands?: ModCommandContribution[]
    styles?: string
    host?: string
    server?: string
    serverBootstrap?: string
    database?: ModDatabaseContribution
    overrides?: ModOverrideContribution[]
  }
}

export type PublicMod = Pick<ModManifest, "id" | "name" | "version" | "description" | "permissions"> & {
  priority: number
  enabled: boolean
  compatible: boolean
  error?: string
  contributes?: ModManifest["contributes"]
  diagnostic?: ModDiagnostic
}

export type ModDiagnostic = {
  phase: "manifest" | "enabled" | "window" | "sidebar" | "style" | "host" | "server" | "server-bootstrap" | "trigger"
  status: "ready" | "pending" | "error" | "disabled"
  message: string
  updatedAt: number
}

export type ModDiagnosticEvent = ModDiagnostic & {
  id: string
}

export type ModConflict = {
  modID: string
  modName: string
  type: "sidebar" | "command" | "style" | "host" | "server" | "server-bootstrap" | "database"
  detail: string
  certain: boolean
  file?: string
  target?: string
}

const idPattern = /^[a-z0-9][a-z0-9._-]*$/
const maxContributionCount = 256

export function parseModManifest(value: unknown): ModManifest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Manifest must be an object")
  const manifest = value as Record<string, unknown>
  if (typeof manifest.id !== "string" || !idPattern.test(manifest.id)) {
    throw new Error("Manifest id must use lowercase letters, numbers, dots, underscores, or hyphens")
  }
  if (typeof manifest.name !== "string" || !manifest.name.trim()) throw new Error("Manifest name is required")
  if (typeof manifest.version !== "string" || !manifest.version.trim()) throw new Error("Manifest version is required")
  if (typeof manifest.entry !== "string" || !manifest.entry.trim()) throw new Error("Manifest entry is required")
  if (manifest.description !== undefined && typeof manifest.description !== "string") {
    throw new Error("Manifest description must be a string")
  }
  if (
    manifest.engines !== undefined &&
    (!manifest.engines ||
      typeof manifest.engines !== "object" ||
      Array.isArray(manifest.engines) ||
      ((manifest.engines as Record<string, unknown>).opencode !== undefined &&
        typeof (manifest.engines as Record<string, unknown>).opencode !== "string"))
  ) {
    throw new Error("Manifest engines.opencode must be a string")
  }
  if (
    manifest.permissions !== undefined &&
    (!Array.isArray(manifest.permissions) ||
      manifest.permissions.some(
        (permission) => typeof permission !== "string" || !MOD_PERMISSIONS.includes(permission as ModPermission),
      ))
  ) {
    throw new Error(`Manifest permissions must be one of: ${MOD_PERMISSIONS.join(", ")}`)
  }
  if (
    manifest.window !== undefined &&
    (!manifest.window ||
      typeof manifest.window !== "object" ||
      Array.isArray(manifest.window) ||
      Object.values(manifest.window as Record<string, unknown>).some(
        (value) =>
          value !== undefined && (!Number.isInteger(value) || (value as number) < 320 || (value as number) > 2400),
      ))
  ) {
    throw new Error("Manifest window dimensions must be integers between 320 and 2400")
  }
  if (
    manifest.contributes !== undefined &&
    (!manifest.contributes || typeof manifest.contributes !== "object" || Array.isArray(manifest.contributes))
  ) {
    throw new Error("Manifest contributes must be an object")
  }
  const contributes = manifest.contributes as Record<string, unknown> | undefined
  if (
    contributes?.sidebar !== undefined &&
    (!Array.isArray(contributes.sidebar) ||
      contributes.sidebar.length > maxContributionCount ||
      contributes.sidebar.some((item) => !isSidebarContribution(item)))
  ) {
    throw new Error("Manifest sidebar contributions must have safe ids, titles, entries, optional numeric order, and at most 256 items")
  }
  if (
    contributes?.commands !== undefined &&
    (!Array.isArray(contributes.commands) ||
      contributes.commands.length > maxContributionCount ||
      contributes.commands.some((item) => !isCommandContribution(item)))
  ) {
    throw new Error("Manifest command contributions must have safe ids, titles, and at most 256 items")
  }
  if (contributes?.styles !== undefined && (typeof contributes.styles !== "string" || !contributes.styles.trim())) {
    throw new Error("Manifest styles contribution must be a path")
  }
  if (contributes?.host !== undefined && (typeof contributes.host !== "string" || !contributes.host.trim())) {
    throw new Error("Manifest host contribution must be a path")
  }
  if (contributes?.server !== undefined && (typeof contributes.server !== "string" || !contributes.server.trim())) {
    throw new Error("Manifest server contribution must be a path")
  }
  if (
    contributes?.serverBootstrap !== undefined &&
    (typeof contributes.serverBootstrap !== "string" || !contributes.serverBootstrap.trim())
  ) {
    throw new Error("Manifest serverBootstrap contribution must be a path")
  }
  if (
    contributes?.database !== undefined &&
    (!contributes.database ||
      typeof contributes.database !== "object" ||
      Array.isArray(contributes.database) ||
      (contributes.database as Record<string, unknown>).source !== "production")
  ) {
    throw new Error('Manifest database contribution must use source "production"')
  }
  if (
    contributes?.overrides !== undefined &&
    (!Array.isArray(contributes.overrides) ||
      contributes.overrides.length > maxContributionCount ||
      contributes.overrides.some((item) => !isOverrideContribution(item)))
  ) {
    throw new Error(
      "Manifest override contributions must declare a supported contribution type, target file, and either a symbolic target or base plus source changes",
    )
  }
  const permissions = [...new Set((manifest.permissions ?? []) as ModPermission[])]
  if (contributes?.sidebar?.length && !permissions.includes("ui.sidebar")) {
    throw new Error("Sidebar contributions require ui.sidebar permission")
  }
  if (contributes?.commands?.length && !permissions.includes("ui.command")) {
    throw new Error("Command contributions require ui.command permission")
  }
  if (contributes?.styles && !permissions.includes("ui.style")) {
    throw new Error("Styles contribution requires ui.style permission")
  }
  if (contributes?.host && !permissions.includes("ui.host")) {
    throw new Error("Host contributions require ui.host permission")
  }
  if (contributes?.server && !permissions.includes("server.host")) {
    throw new Error("Server contributions require server.host permission")
  }
  if (contributes?.serverBootstrap && !permissions.includes("server.host")) {
    throw new Error("Server bootstrap contributions require server.host permission")
  }
  if (contributes?.database && !permissions.includes("server.database")) {
    throw new Error("Database contributions require server.database permission")
  }
  const overrides = (contributes?.overrides as Array<Record<string, unknown>> | undefined)?.map((item) => ({
    type: item.type as ModOverrideContribution["type"],
    file: (item.file as string).trim(),
    target: typeof item.target === "string" ? item.target.trim() : undefined,
    base: typeof item.base === "string" ? item.base.trim() : undefined,
    changes: (item.changes as Array<Record<string, unknown>> | undefined)?.map((change) => ({
      operation: change.operation as ModOverrideChange["operation"],
      start: change.start as number,
      end: change.end as number,
      content: change.content as string | undefined,
    })),
  }))
  if (overrides?.some((item) => !hasContributionForOverride(contributes, item.type))) {
    throw new Error("Override contributions must reference a declared contribution of the same type")
  }
  if (
    overrides &&
    new Set(
      overrides.map((item) =>
        item.changes
          ? `${item.type}\n${item.file}\n${item.base}\n${item.changes
              .map((change) => `${change.operation}:${change.start}:${change.end}:${change.content ?? ""}`)
              .join("|")}`
          : `${item.type}\n${item.file}\n${item.target}`,
      ),
    ).size !== overrides.length
  ) {
    throw new Error("Override contributions must be unique")
  }
  const sidebar = (contributes?.sidebar as Array<Record<string, unknown>> | undefined)?.map((item) => ({
    id: item.id as string,
    title: (item.title as string).trim(),
    entry: item.entry as string,
    order: item.order as number | undefined,
  }))
  const commands = (contributes?.commands as Array<Record<string, unknown>> | undefined)?.map((item) => ({
    id: item.id as string,
    title: (item.title as string).trim(),
    description: item.description as string | undefined,
    panel: item.panel as string | undefined,
  }))
  if (sidebar && new Set(sidebar.map((item) => item.id)).size !== sidebar.length) {
    throw new Error("Sidebar contribution ids must be unique")
  }
  if (commands && new Set(commands.map((item) => item.id)).size !== commands.length) {
    throw new Error("Command contribution ids must be unique")
  }
  if (commands?.some((command) => command.panel && !sidebar?.some((panel) => panel.id === command.panel))) {
    throw new Error("Command contribution panel must reference a sidebar contribution")
  }

  return {
    id: manifest.id,
    name: manifest.name.trim(),
    version: manifest.version.trim(),
    description: manifest.description,
    engines: manifest.engines as ModManifest["engines"],
    permissions,
    entry: manifest.entry,
    window: manifest.window as ModManifest["window"],
    contributes: {
      sidebar,
      commands,
      styles: contributes?.styles as string | undefined,
      host: contributes?.host as string | undefined,
      server: contributes?.server as string | undefined,
      serverBootstrap: contributes?.serverBootstrap as string | undefined,
      database: contributes?.database as ModDatabaseContribution | undefined,
      overrides,
    },
  }
}

export function resolveModPath(root: string, input: string) {
  const file = resolve(root, `.${input.startsWith("/") ? input : `/${input}`}`)
  const path = relative(root, file)
  if (path.startsWith("..") || isAbsolute(path)) throw new Error("Path must stay inside the MOD directory")
  return file
}

export function isModCompatible(range: string | undefined, version: string) {
  if (!range || range === "*") return true
  if (range === version) return true
  const current = version.split(".").map(Number)
  const requested = range.match(/^([~^])(\d+)\.(\d+)(?:\.(\d+))?$/)
  if (!requested || current.some(Number.isNaN)) return false
  const [, operator, major, minor, patch = "0"] = requested
  const target = [Number(major), Number(minor), Number(patch)]
  if (operator === "^") return current[0] === target[0] && compareVersions(current, target) >= 0
  return current[0] === target[0] && current[1] === target[1] && compareVersions(current, target) >= 0
}

export function findModConflicts(candidate: ModManifest, existing: ModManifest): ModConflict[] {
  const conflict = (
    type: ModConflict["type"],
    detail: string,
    certain: boolean,
    location?: Pick<ModConflict, "file" | "target">,
  ): ModConflict => ({
    modID: existing.id,
    modName: existing.name,
    type,
    detail,
    certain,
    ...location,
  })
  const sidebarIDs = new Set(existing.contributes?.sidebar?.map((item) => item.id))
  const commandIDs = new Set(existing.contributes?.commands?.map((item) => item.id))
  const sidebar = candidate.contributes?.sidebar
    ?.flatMap((item) =>
      sidebarIDs.has(item.id)
        ? [conflict("sidebar", `Both MODs contribute the "${item.id}" sidebar panel.`, true)]
        : [],
    )
  const commands = candidate.contributes?.commands
    ?.flatMap((item) =>
      commandIDs.has(item.id)
        ? [conflict("command", `Both MODs contribute the "${item.id}" command.`, true)]
        : [],
    )
  const overrides =
    candidate.contributes?.overrides?.flatMap((candidateOverride) =>
      (existing.contributes?.overrides ?? []).flatMap((existingOverride) => {
        if (
          candidateOverride.type !== existingOverride.type ||
          candidateOverride.file !== existingOverride.file
        ) {
          return []
        }
        if (candidateOverride.changes && existingOverride.changes) {
          if (candidateOverride.base !== existingOverride.base) {
            return [
              conflict(
                candidateOverride.type,
                `Both MODs patch "${candidateOverride.file}" from different base revisions. Review the patches before combining them.`,
                false,
                { file: candidateOverride.file, target: "different base revisions" },
              ),
            ]
          }
          return candidateOverride.changes.flatMap((candidateChange) =>
            existingOverride.changes!.flatMap((existingChange) => {
              if (!changesOverlap(candidateChange, existingChange) || changesEqual(candidateChange, existingChange)) return []
              const target = formatChangeRange(candidateChange)
              return [
                conflict(
                  candidateOverride.type,
                  `Both MODs change ${target} in "${candidateOverride.file}". The higher-priority MOD loads later and owns the overlapping change.`,
                  true,
                  { file: candidateOverride.file, target },
                ),
              ]
            }),
          )
        }
        if (
          candidateOverride.target &&
          existingOverride.target &&
          candidateOverride.target === existingOverride.target
        ) {
          return [
            conflict(
              candidateOverride.type,
              `Both MODs override "${candidateOverride.target}" in "${candidateOverride.file}". The higher-priority MOD loads later and owns this location.`,
              true,
              { file: candidateOverride.file, target: candidateOverride.target },
            ),
          ]
        }
        return []
      }),
    ) ?? []
  return [...(sidebar ?? []), ...(commands ?? []), ...overrides]
}

function compareVersions(left: number[], right: number[]) {
  for (const index of [0, 1, 2]) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

function isContributionID(value: unknown): value is string {
  return typeof value === "string" && idPattern.test(value)
}

function isSidebarContribution(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  return (
    isContributionID(item.id) &&
    typeof item.title === "string" &&
    Boolean(item.title.trim()) &&
    typeof item.entry === "string" &&
    Boolean(item.entry.trim()) &&
    (item.order === undefined || Number.isFinite(item.order))
  )
}

function isCommandContribution(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  return (
    isContributionID(item.id) &&
    typeof item.title === "string" &&
    Boolean(item.title.trim()) &&
    (item.description === undefined || typeof item.description === "string") &&
    (item.panel === undefined || isContributionID(item.panel))
  )
}

function isOverrideContribution(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  return (
    ["style", "host", "server", "server-bootstrap"].includes(item.type as string) &&
    typeof item.file === "string" &&
    Boolean(item.file.trim()) &&
    ((typeof item.target === "string" && Boolean(item.target.trim()) && item.base === undefined && item.changes === undefined) ||
      (typeof item.base === "string" &&
        Boolean(item.base.trim()) &&
        Array.isArray(item.changes) &&
        item.changes.length > 0 &&
        item.changes.length <= maxContributionCount &&
        item.changes.every(isOverrideChange)))
  )
}

function hasContributionForOverride(contributes: Record<string, unknown> | undefined, type: ModOverrideContribution["type"]) {
  if (type === "style") return Boolean(contributes?.styles)
  if (type === "host") return Boolean(contributes?.host)
  if (type === "server") return Boolean(contributes?.server)
  return Boolean(contributes?.serverBootstrap)
}

function isOverrideChange(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  const operation = item.operation
  if (!["add", "modify", "delete"].includes(operation as string)) return false
  if (!Number.isSafeInteger(item.start) || !Number.isSafeInteger(item.end) || (item.start as number) < 1) return false
  if (operation === "add" ? item.start !== item.end : (item.end as number) < (item.start as number)) return false
  return item.content === undefined || typeof item.content === "string"
}

function changesOverlap(left: ModOverrideChange, right: ModOverrideChange) {
  if (left.operation === "add" && right.operation === "add") return left.start === right.start
  if (left.operation === "add") return left.start >= right.start && left.start <= right.end
  if (right.operation === "add") return right.start >= left.start && right.start <= left.end
  return left.start <= right.end && right.start <= left.end
}

function changesEqual(left: ModOverrideChange, right: ModOverrideChange) {
  return (
    left.operation === right.operation &&
    left.start === right.start &&
    left.end === right.end &&
    left.content === right.content
  )
}

function formatChangeRange(change: ModOverrideChange) {
  if (change.operation === "add") return `line ${change.start} insertion`
  return change.start === change.end ? `line ${change.start}` : `lines ${change.start}-${change.end}`
}
