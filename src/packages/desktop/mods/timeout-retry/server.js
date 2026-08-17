const TIMEOUT_ABORT_PATTERN = /\baborted due to timeout\b/i;
const SHELL_TOOL_ID = "bash";
const MIN_SHELL_TIMEOUT_MS = 10 * 60 * 1_000;

export default {
  id: "timeout-retry",

  async server() {
    return {
      "chat.retry": async (input, output) => {
        const message = errorMessage(input.error);
        if (!TIMEOUT_ABORT_PATTERN.test(message)) return;

        const attempt = input.attempt + 1;
        output.retry = {
          message: [
            "Model request timed out before a response was received.",
            `Provider: ${input.providerID}.`,
            `Retry attempt ${attempt} will begin in 2 seconds.`,
            "If this repeats, check the provider and network connection, then increase provider.options.timeout in opencode.json.",
          ].join("\n"),
        };
        output.delay = 2_000;
      },

      "tool.execute.before": async (input, output) => {
        if (input.tool !== SHELL_TOOL_ID || !isRecord(output.args)) return;

        const requested = output.args.timeout;
        if (typeof requested === "number" && requested >= MIN_SHELL_TIMEOUT_MS)
          return;

        output.args = {
          ...output.args,
          timeout: MIN_SHELL_TIMEOUT_MS,
        };
      },
    };
  },
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function errorMessage(error) {
  if (error && typeof error === "object") {
    const data = error.data;
    if (data && typeof data === "object" && typeof data.message === "string")
      return data.message;
    if (typeof error.message === "string") return error.message;
  }
  return String(error);
}
