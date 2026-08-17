import { randomUUID } from "node:crypto"
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import type { createModManager } from "./mods"

type ModManager = ReturnType<typeof createModManager>

export type ModDebugTrigger =
  | { id: string; action: "open-window" }
  | { id: string; action: "host"; name: string; input?: unknown }

export type ModDebugListener = {
  url: string
  token: string
  close: () => Promise<void>
}

export async function startModDebugListener(
  mods: ModManager,
  options: { trigger: (request: ModDebugTrigger) => Promise<{ message: string }> },
): Promise<ModDebugListener> {
  const token = randomUUID()
  const clients = new Set<ServerResponse>()
  const writeEvent = (client: ServerResponse, name: string, data: unknown) => {
    client.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
  }
  const authorized = (request: IncomingMessage) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1")
    return url.searchParams.get("token") === token || request.headers.authorization === `Bearer ${token}`
  }
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1")
    if (!authorized(request)) {
      response.writeHead(401, { "content-type": "application/json" })
      response.end(JSON.stringify({ error: "Unauthorized" }))
      return
    }
    if (request.method === "POST" && url.pathname === "/trigger") {
      void readTrigger(request)
        .then(options.trigger)
        .then((result) => {
          response.writeHead(202, { "content-type": "application/json" })
          response.end(JSON.stringify(result))
        })
        .catch((error) => {
          response.writeHead(400, { "content-type": "application/json" })
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid trigger request" }))
        })
      return
    }
    if (request.method !== "GET") {
      response.writeHead(405, { allow: "GET, POST", "content-type": "application/json" })
      response.end(JSON.stringify({ error: "Method not allowed" }))
      return
    }
    if (url.pathname === "/diagnostics") {
      response.writeHead(200, { "cache-control": "no-store", "content-type": "application/json" })
      response.end(JSON.stringify(mods.diagnosticHistory()))
      return
    }
    if (url.pathname !== "/events") {
      response.writeHead(404, { "content-type": "application/json" })
      response.end(JSON.stringify({ error: "Not found" }))
      return
    }
    response.writeHead(200, {
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "content-type": "text/event-stream; charset=utf-8",
    })
    response.flushHeaders()
    clients.add(response)
    writeEvent(response, "snapshot", mods.diagnosticHistory())
    request.once("close", () => clients.delete(response))
  })
  const unsubscribe = mods.subscribeDiagnostics((event) => {
    clients.forEach((client) => writeEvent(client, "diagnostic", event))
  })
  const address = await listen(server)
  const url = `http://127.0.0.1:${address.port}`
  return {
    url,
    token,
    close: async () => {
      unsubscribe()
      clients.forEach((client) => client.end())
      clients.clear()
      await close(server)
    },
  }
}

async function readTrigger(request: IncomingMessage): Promise<ModDebugTrigger> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += value.length
    if (size > 64 * 1024) throw new Error("Trigger request is too large")
    chunks.push(value)
  }
  let value: unknown
  try {
    value = JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    throw new Error("Trigger request must be valid JSON")
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Trigger request must be an object")
  const requestValue = value as Record<string, unknown>
  if (typeof requestValue.id !== "string" || !requestValue.id) throw new Error("Trigger request requires a MOD id")
  if (requestValue.action === "open-window") return { id: requestValue.id, action: "open-window" }
  if (requestValue.action === "host" && typeof requestValue.name === "string" && requestValue.name.trim()) {
    return { id: requestValue.id, action: "host", name: requestValue.name, input: requestValue.input }
  }
  throw new Error("Unsupported trigger request")
}

function listen(server: Server) {
  return new Promise<AddressInfo>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject)
      resolve(server.address() as AddressInfo)
    })
  })
}

function close(server: Server) {
  return new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
}
