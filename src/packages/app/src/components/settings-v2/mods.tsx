import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Switch } from "@opencode-ai/ui/switch"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { For, Show, createResource, createSignal, onCleanup, type Component } from "solid-js"
import { usePlatform, type DesktopMod, type DesktopModDiagnosticEvent } from "@/context/platform"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import { DialogModConflictV2 } from "./dialog-mod-conflict-v2"

export const SettingsModsV2: Component = () => {
  const platform = usePlatform()
  const dialog = useDialog()
  const [mods, { refetch }] = createResource(() => platform.mods?.list(), { initialValue: [] as DesktopMod[] })
  const [safeMode, { refetch: refetchSafeMode }] = createResource(() => platform.mods?.safeMode(), { initialValue: false })
  const [diagnostics, { refetch: refetchDiagnostics }] = createResource(
    () => platform.mods?.diagnosticHistory(),
    { initialValue: [] as DesktopModDiagnosticEvent[] },
  )
  const [debugListener] = createResource(() => platform.mods?.debugListener())
  const [debugModID, setDebugModID] = createSignal<string>()
  const [copyStatus, setCopyStatus] = createSignal<string>()
  const modList = () => mods.latest ?? []
  const selectedDebugMod = () => modList().find((mod) => mod.id === debugModID())
  const visibleDiagnostics = () => {
    const id = debugModID()
    return id ? (diagnostics.latest ?? []).filter((event) => event.id === id) : (diagnostics.latest ?? [])
  }
  const diagnosticTimer = setInterval(() => {
    void refetch()
    void refetchDiagnostics()
  }, 2_000)
  onCleanup(() => clearInterval(diagnosticTimer))
  const diagnostic = (mod: DesktopMod) => {
    const item = mod.diagnostic
    if (!item) return undefined
    const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(
      item.updatedAt,
    )
    return `${item.status === "error" ? "Debug error" : "Debug"} · ${item.message} (${time})`
  }
  const diagnosticTime = (updatedAt: number) =>
    new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(updatedAt)
  const copyText = async (text: string, success: string) => {
    try {
      if (platform.writeClipboardText) {
        await platform.writeClipboardText(text)
      } else {
        await navigator.clipboard.writeText(text)
      }
      setCopyStatus(success)
    } catch {
      setCopyStatus("Copy failed")
    }
    window.setTimeout(() => setCopyStatus(undefined), 2_000)
  }
  const copyDebugListener = () => {
    const listener = debugListener.latest
    if (!listener) return
    void copyText(`${listener.url}/events?token=${listener.token}`, "Listener copied")
  }
  const copyDiagnostics = () => {
    const text = visibleDiagnostics()
      .map(
        (event) =>
          `[${new Date(event.updatedAt).toISOString()}] ${event.status.toUpperCase()} ${event.id} ${event.phase}: ${event.message}`,
      )
      .join("\n")
    if (!text) return
    void copyText(text, "Logs copied")
  }

  const applyChange = (mod: DesktopMod) => {
    if (mod.contributes?.server || mod.contributes?.database) {
      void platform.restart()
      return
    }
    if (mod.contributes?.host) {
      window.location.reload()
      return
    }
    void refetch()
  }

  const refresh = () => {
    void platform.mods?.reload().then((loaded) => {
      if (loaded.some((mod) => mod.enabled && mod.compatible && (mod.contributes?.server || mod.contributes?.database))) {
        void platform.restart()
        return
      }
      if (loaded.some((mod) => mod.enabled && mod.compatible && mod.contributes?.host)) {
        window.location.reload()
        return
      }
      void refetch()
    })
  }

  const enable = async (mod: DesktopMod) => {
    const modManager = platform.mods
    if (!modManager) return
    const report = await modManager.preload(mod.id)
    if (!report) return
    if (report.conflicts.length) {
      void dialog.show(() => (
        <DialogModConflictV2
          mod={report.mod}
          directory={report.directory}
          conflicts={report.conflicts}
          onResolve={async (resolution) => {
            const loaded = await platform.mods!.setEnabled(mod.id, true, resolution)
            const resolved = loaded.find((item) => item.id === mod.id) ?? mod
            applyChange(resolved)
          }}
        />
      ))
      return
    }
    const loaded = await modManager.setEnabled(mod.id, true)
    applyChange(loaded.find((item) => item.id === mod.id) ?? mod)
  }

  return (
    <>
      <div class="settings-v2-tab-header">
        <div class="settings-v2-tab-header-row">
          <h2 class="settings-v2-tab-title">MODs</h2>
          <div class="flex gap-2">
            <ButtonV2 size="small" variant="neutral" onClick={() => void platform.mods?.openFolder()}>
              Open folder
            </ButtonV2>
            <ButtonV2 size="small" variant="neutral" onClick={refresh}>
              Refresh
            </ButtonV2>
          </div>
        </div>
      </div>

      <div class="settings-v2-tab-body">
        <div class="settings-v2-section">
          <SettingsListV2>
            <SettingsRowV2
              title="Safe mode"
              description="Disable all MODs until MOD loading is enabled again."
            >
              <Switch
                checked={!safeMode.latest}
                onChange={(enabled) => {
                  void platform.mods?.setSafeMode(!enabled).then((loaded) => {
                    void refetchSafeMode()
                    if (
                      loaded.some(
                        (mod) => mod.enabled && mod.compatible && (mod.contributes?.server || mod.contributes?.database),
                      )
                    ) {
                      void platform.restart()
                      return
                    }
                    window.location.reload()
                  })
                }}
              />
            </SettingsRowV2>
          </SettingsListV2>
        </div>

        <Show
          when={modList().length}
          fallback={<div class="settings-v2-servers-status">No MODs found in the MOD folder.</div>}
        >
          <div class="settings-v2-section">
            <SettingsListV2>
              <For each={modList()}>
                {(mod) => (
                  <SettingsRowV2
                    title={mod.name}
                    description={
                      mod.error ??
                      diagnostic(mod) ??
                      (mod.compatible
                        ? `v${mod.version} · Priority ${mod.priority}`
                        : `v${mod.version} · Incompatible with this OpenCode version`)
                    }
                  >
                    <div class="flex items-center gap-2">
                      <ButtonV2
                        size="small"
                        variant={debugModID() === mod.id ? "neutral" : "ghost-muted"}
                        onClick={() => setDebugModID(mod.id)}
                      >
                        Debug
                      </ButtonV2>
                      <ButtonV2
                        size="small"
                        variant="ghost-muted"
                        disabled={Boolean(mod.error) || mod.priority <= -1000}
                        onClick={() => {
                          void platform.mods?.setPriority(mod.id, mod.priority - 1).then(() => applyChange(mod))
                        }}
                      >
                        -
                      </ButtonV2>
                      <ButtonV2
                        size="small"
                        variant="ghost-muted"
                        disabled={Boolean(mod.error) || mod.priority >= 1000}
                        onClick={() => {
                          void platform.mods?.setPriority(mod.id, mod.priority + 1).then(() => applyChange(mod))
                        }}
                      >
                        +
                      </ButtonV2>
                      <Switch
                        checked={mod.enabled}
                        disabled={!mod.compatible}
                        onChange={(enabled) => {
                          if (enabled) {
                            void enable(mod)
                            return
                          }
                          void platform.mods?.setEnabled(mod.id, false).then(() => applyChange(mod))
                        }}
                      />
                    </div>
                  </SettingsRowV2>
                )}
              </For>
            </SettingsListV2>
          </div>
        </Show>

        <div class="settings-v2-section">
          <div class="settings-v2-tab-header-row">
            <h3 class="settings-v2-tab-title">
              MOD Debug Console{selectedDebugMod() ? ` · ${selectedDebugMod()!.name}` : ""}
            </h3>
            <div class="flex gap-2">
              <ButtonV2
                size="small"
                variant="neutral"
                disabled={!debugModID()}
                onClick={() => setDebugModID(undefined)}
              >
                All MODs
              </ButtonV2>
              <ButtonV2 size="small" variant="neutral" disabled={!debugListener.latest} onClick={copyDebugListener}>
                {copyStatus() === "Listener copied" ? copyStatus() : "Copy listener"}
              </ButtonV2>
              <ButtonV2
                size="small"
                variant="neutral"
                disabled={!visibleDiagnostics().length}
                onClick={copyDiagnostics}
              >
                {copyStatus() === "Logs copied" ? copyStatus() : "Copy logs"}
              </ButtonV2>
              <ButtonV2 size="small" variant="neutral" onClick={() => void refetchDiagnostics()}>
                Refresh
              </ButtonV2>
              <ButtonV2
                size="small"
                variant="neutral"
                disabled={!diagnostics.latest?.length}
                onClick={() => {
                  void platform.mods?.clearDiagnosticHistory().then(() => void refetchDiagnostics())
                }}
              >
                Clear
              </ButtonV2>
            </div>
          </div>
          <Show when={copyStatus() === "Copy failed"}>
            <div class="settings-v2-servers-status">Could not copy to the system clipboard.</div>
          </Show>
          <Show
            when={visibleDiagnostics().length}
            fallback={
              <div class="settings-v2-servers-status">
                {selectedDebugMod()
                  ? `No debug events recorded for ${selectedDebugMod()!.name} in this app session.`
                  : "No MOD debug events recorded in this app session."}
              </div>
            }
          >
            <div class="max-h-80 overflow-y-auto border border-border-base px-3 py-2 font-mono text-xs leading-5">
              <For each={visibleDiagnostics()}>
                {(event) => (
                  <div class={event.status === "error" ? "text-text-error" : "text-text-base"}>
                    [{diagnosticTime(event.updatedAt)}] {event.status.toUpperCase()} {event.id} {event.phase}: {event.message}
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </>
  )
}
