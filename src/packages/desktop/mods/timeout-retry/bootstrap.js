const MARKER = Symbol.for("opencode.timeout-retry.bootstrap");

export default async function bootstrap(context) {
  if (globalThis[MARKER]) return;
  globalThis[MARKER] = true;

  const originalFetch = globalThis.fetch;
  if (typeof originalFetch !== "function") {
    context.log("global fetch is unavailable; transport diagnostics were not installed");
    return;
  }

  globalThis.fetch = async function timeoutDiagnosticFetch(input, init) {
    const startedAt = Date.now();
    const target = typeof input === "string" || input instanceof URL ? String(input) : input.url;
    try {
      return await originalFetch(input, init);
    } catch (error) {
      if (isTimeoutAbort(error)) {
        const elapsedMs = Date.now() - startedAt;
        context.log("provider transport timed out", { elapsedMs, target: redactTarget(target) });
        throw new DOMException(
          [
            "The operation was aborted due to timeout.",
            `Request target: ${redactTarget(target)}.`,
            `Elapsed before abort: ${elapsedMs}ms.`,
            "The Timeout Retry MOD will request a delayed model retry when the active turn remains retryable.",
          ].join("\n"),
          "AbortError",
        );
      }
      throw error;
    }
  };

  context.log("installed pre-server timeout diagnostics");
}

function isTimeoutAbort(error) {
  return error instanceof DOMException && error.name === "AbortError" && /timeout/i.test(error.message);
}

function redactTarget(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return "<unavailable>";
  }
}
