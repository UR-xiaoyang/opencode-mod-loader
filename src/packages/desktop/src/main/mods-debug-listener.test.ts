import { expect, test } from "bun:test"
import { startModDebugListener } from "./mods-debug-listener"
import type { ModDiagnosticEvent } from "./mods-manifest"

test("MOD debug listener protects snapshots and streams diagnostic events", async () => {
  const history: ModDiagnosticEvent[] = [
    {
      id: "example.mod",
      phase: "manifest",
      status: "ready",
      message: "Manifest is valid.",
      updatedAt: 1,
    },
  ]
  const listeners = new Set<(event: ModDiagnosticEvent) => void>()
  const triggers: unknown[] = []
  const listener = await startModDebugListener({
    diagnosticHistory: () => [...history],
    subscribeDiagnostics: (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
  } as never, {
    trigger: async (request) => {
      triggers.push(request)
      return { message: "Triggered." }
    },
  })

  try {
    const denied = await fetch(`${listener.url}/diagnostics`)
    expect(denied.status).toBe(401)

    const snapshot = await fetch(`${listener.url}/diagnostics?token=${listener.token}`)
    expect(snapshot.status).toBe(200)
    expect(await snapshot.json()).toEqual(history)

    const triggered = await fetch(`${listener.url}/trigger?token=${listener.token}`, {
      method: "POST",
      body: JSON.stringify({ id: "example.mod", action: "open-window" }),
    })
    expect(triggered.status).toBe(202)
    expect(await triggered.json()).toEqual({ message: "Triggered." })
    expect(triggers).toEqual([{ id: "example.mod", action: "open-window" }])

    const stream = await fetch(`${listener.url}/events?token=${listener.token}`)
    const reader = stream.body!.getReader()
    const initial = new TextDecoder().decode((await reader.read()).value)
    expect(initial).toContain("event: snapshot")
    expect(initial).toContain("example.mod")

    listeners.forEach((callback) =>
      callback({
        id: "example.mod",
        phase: "host",
        status: "error",
        message: "Host script failed.",
        updatedAt: 2,
      }),
    )
    const next = new TextDecoder().decode((await reader.read()).value)
    expect(next).toContain("event: diagnostic")
    expect(next).toContain("Host script failed.")
    await reader.cancel()
  } finally {
    await listener.close()
  }
})
