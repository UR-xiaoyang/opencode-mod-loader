import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@opencode-ai/ui/v2/dialog-v2"
import { DividerV2 } from "@opencode-ai/ui/v2/divider-v2"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { useNavigate } from "@solidjs/router"
import { For, type Component } from "solid-js"
import type { DesktopMod, DesktopModConflict } from "@/context/platform"

export const DialogModConflictV2: Component<{
  mod: DesktopMod
  directory: string
  conflicts: DesktopModConflict[]
  onResolve: (resolution: "candidate" | "existing") => Promise<void>
}> = (props) => {
  const dialog = useDialog()
  const navigate = useNavigate()

  const resolve = (resolution: "candidate" | "existing") => {
    void props.onResolve(resolution).then(() => dialog.close())
  }

  return (
    <Dialog fit>
      <DialogHeader>
        <DialogTitle>MOD load conflict</DialogTitle>
      </DialogHeader>
      <DividerV2 />
      <DialogBody class="flex w-full min-w-0 flex-1 flex-col gap-4 px-4 pt-4 pb-2">
        <p class="text-14-regular text-text-weak">
          {props.mod.name} overlaps with enabled MOD contributions. The higher-priority MOD loads later and wins where
          load order can resolve the overlap.
        </p>
        <div class="flex min-w-0 flex-col gap-2">
          <For each={props.conflicts}>
            {(conflict) => (
              <div class="flex min-w-0 flex-col gap-1 border border-border-weak px-3 py-2">
                <span class="text-14-medium text-text-strong">
                  {conflict.modName} · {conflict.certain ? "Declared conflict" : "Potential conflict"}
                </span>
                <span class="text-13-regular text-text-weak">{conflict.detail}</span>
              </div>
            )}
          </For>
        </div>
      </DialogBody>
      <DialogFooter>
        <ButtonV2 variant="neutral" onClick={() => dialog.close()}>
          Cancel
        </ButtonV2>
        <ButtonV2
          variant="neutral"
          onClick={() => {
            dialog.close()
            navigate(
              `/${base64Encode(props.directory)}/session?${new URLSearchParams({
                prompt: `Resolve MOD loading conflicts for ${props.mod.name}. Review mod.json and the MOD source, then implement a compatibility patch. Conflicts: ${props.conflicts.map((conflict) => `${conflict.modName}: ${conflict.detail}`).join(" ")}`,
              })}`,
            )
          }}
        >
          Repair with AI
        </ButtonV2>
        <ButtonV2 variant="outline" onClick={() => resolve("existing")}>
          Keep existing priority
        </ButtonV2>
        <ButtonV2 variant="contrast" onClick={() => resolve("candidate")}>
          Prioritize {props.mod.name}
        </ButtonV2>
      </DialogFooter>
    </Dialog>
  )
}
