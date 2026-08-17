import { tool } from "@opencode-ai/plugin"

const MAX_TASKS_PER_CALL = 8
const MAX_REPORT_LENGTH = 12000
const TOOL_IDS = ["parallel_tasks", "parallel_status", "parallel_collect", "parallel_cancel"]

const tasksSchema = tool.schema.object({
  tasks: tool.schema
    .array(
      tool.schema.object({
        title: tool.schema.string().min(3).max(120),
        prompt: tool.schema.string().min(20),
      }),
    )
    .min(1)
    .max(MAX_TASKS_PER_CALL),
})

const taskIDsSchema = tool.schema.object({
  task_ids: tool.schema.array(tool.schema.string()).min(1).optional(),
})

const statusSchema = tool.schema.object({
  task_ids: tool.schema.array(tool.schema.string()).optional(),
})

export default {
  id: "parallel-conversations",

  async server({ client }) {
    const tasks = new Map()
    const models = new Map()
    const childSessions = new Set()

    const ownTasks = (parentID, taskIDs) =>
      [...tasks.values()].filter((task) => task.parentID === parentID && (!taskIDs || taskIDs.includes(task.id)))

    const snapshot = (task, includeReport = false) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      progress: task.progress,
      started_at: task.startedAt,
      finished_at: task.finishedAt,
      ...(includeReport && task.report ? { report: task.report } : {}),
      ...(task.error ? { error: task.error } : {}),
    })

    const latestReport = async (task) => {
      const response = await client.session.messages({ path: { id: task.id } })
      const messages = response.data ?? []
      const assistant = [...messages].reverse().find((message) => message.info.role === "assistant")
      const text = assistant?.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n")
        .trim()
      return text || "The parallel task finished without a text report."
    }

    const reportToParent = async (task) => {
      if (task.reported) return
      task.reported = true

      const outcome =
        task.status === "completed"
          ? task.report
          : `The task did not complete successfully.\n${task.error || task.report || "No further details were returned."}`
      const message = [
        `<parallel-task id="${task.id}" status="${task.status}">`,
        `<title>${task.title}</title>`,
        "<report>",
        outcome,
        "</report>",
        "</parallel-task>",
        "A parallel task has reported back. Reconcile it with the active user request, decide the next useful step, and provide the final user-facing synthesis yourself when the work is complete.",
      ].join("\n")

      await client.session.promptAsync({
        path: { id: task.parentID },
        body: {
          agent: task.agent,
          model: task.model,
          parts: [{ type: "text", text: message, synthetic: true }],
        },
      })
    }

    const finish = async (task) => {
      if (task.status === "completed" || task.status === "error" || task.status === "cancelled") return
      try {
        task.report = (await latestReport(task)).slice(0, MAX_REPORT_LENGTH)
        task.status = "completed"
      } catch (error) {
        task.status = "error"
        task.error = errorMessage(error)
      }
      task.finishedAt = Date.now()
      task.progress = task.status === "completed" ? "Report ready for the primary conversation." : task.error
      await reportToParent(task)
    }

    const launch = async (input, context) => {
      const model = models.get(context.sessionID)
      if (!model) {
        throw new Error("The primary session model is unavailable. Send the request again after selecting a model.")
      }

      context.metadata({
        title: `Launching ${input.tasks.length} parallel task${input.tasks.length === 1 ? "" : "s"}`,
        metadata: { count: input.tasks.length },
      })

      const launched = await Promise.all(
        input.tasks.map(async (specification) => {
          const created = await client.session.create({
            body: {
              parentID: context.sessionID,
              title: `Parallel: ${specification.title}`,
            },
          })
          const session = created.data
          if (!session) throw new Error(`Unable to create parallel task "${specification.title}"`)

          const task = {
            id: session.id,
            parentID: context.sessionID,
            title: specification.title,
            status: "running",
            progress: "Starting child conversation.",
            startedAt: Date.now(),
            finishedAt: undefined,
            agent: context.agent,
            model,
            report: undefined,
            error: undefined,
            reported: false,
          }
          tasks.set(task.id, task)
          childSessions.add(task.id)

          await client.session.promptAsync({
            path: { id: task.id },
            body: {
              agent: task.agent,
              model: task.model,
              tools: Object.fromEntries(TOOL_IDS.map((id) => [id, false])),
              parts: [
                {
                  type: "text",
                  text: [
                    "You are a parallel worker supporting a primary conversation.",
                    "Complete only the assigned task. Do not delegate further work or ask the user questions.",
                    "Use the available tools as needed, then end with a concise but concrete report containing findings, changes made, verification, and unresolved risks.",
                    "",
                    `Task title: ${task.title}`,
                    "Assigned task:",
                    specification.prompt,
                  ].join("\n"),
                },
              ],
            },
          })

          return snapshot(task)
        }),
      )

      return {
        title: `Launched ${launched.length} parallel task${launched.length === 1 ? "" : "s"}`,
        metadata: { tasks: launched },
        output: JSON.stringify(
          {
            message:
              "Tasks are running independently. Continue only with non-overlapping work. Completed task reports will be delivered automatically to this conversation.",
            tasks: launched,
          },
          null,
          2,
        ),
      }
    }

    return {
      tool: {
        parallel_tasks: tool({
          description:
            "Launch 1-8 independent child conversations in parallel. Each child works on its assigned task and automatically reports its final result back to this primary conversation. Use for independent, substantial work only; continue with non-overlapping work after launching.",
          args: tasksSchema.shape,
          execute: launch,
        }),

        parallel_status: tool({
          description:
            "Inspect progress for the parallel tasks launched by this conversation. Use this only when progress changes the next decision; completed reports are delivered automatically.",
          args: statusSchema.shape,
          async execute(input, context) {
            const current = ownTasks(context.sessionID, input.task_ids)
            return {
              title: "Parallel task status",
              metadata: { count: current.length },
              output: JSON.stringify(current.map((task) => snapshot(task)), null, 2),
            }
          },
        }),

        parallel_collect: tool({
          description:
            "Collect completed reports from parallel tasks launched by this conversation. This is useful for comparing several finished results before synthesizing them. Reports are also delivered automatically when each task completes.",
          args: taskIDsSchema.shape,
          async execute(input, context) {
            const current = ownTasks(context.sessionID, input.task_ids)
            const completed = current.filter((task) => task.status === "completed" || task.status === "error")
            return {
              title: "Collected parallel task reports",
              metadata: { requested: current.length, completed: completed.length },
              output: JSON.stringify(completed.map((task) => snapshot(task, true)), null, 2),
            }
          },
        }),

        parallel_cancel: tool({
          description: "Cancel one or more running parallel tasks launched by this conversation.",
          args: taskIDsSchema.shape,
          async execute(input, context) {
            const current = ownTasks(context.sessionID, input.task_ids).filter((task) => task.status === "running")
            await Promise.all(
              current.map(async (task) => {
                await client.session.abort({ path: { id: task.id } })
                task.status = "cancelled"
                task.finishedAt = Date.now()
                task.progress = "Cancelled by the primary conversation."
              }),
            )
            return {
              title: "Cancelled parallel tasks",
              metadata: { count: current.length },
              output: JSON.stringify(current.map((task) => snapshot(task)), null, 2),
            }
          },
        }),
      },

      "chat.message": async (input) => {
        if (childSessions.has(input.sessionID)) return
        if (!input.model?.providerID || !input.model.modelID) return
        models.set(input.sessionID, input.model)
      },

      "experimental.chat.system.transform": async (input, output) => {
        if (!input.sessionID || childSessions.has(input.sessionID)) return
        output.system.push(
          [
            "Parallel conversations are available through the parallel_tasks tool.",
            "Use it proactively for independent, substantial tasks that benefit from concurrent work. Give each task a precise, non-overlapping objective and the exact report you need back.",
            "After launching tasks, use parallel_status only when progress affects your decision. Completed reports arrive automatically as synthetic updates; you remain responsible for deciding follow-up work, reconciling results, and producing the final answer to the user.",
          ].join(" "),
        )
      },

      event: async ({ event }) => {
        if (event.type === "session.status") {
          const task = tasks.get(event.properties.sessionID)
          if (!task || task.status !== "running") return
          task.progress =
            event.properties.status.type === "busy"
              ? "The child conversation is working."
              : event.properties.status.type === "retry"
                ? `Retrying: ${event.properties.status.message}`
                : "Waiting for the child conversation to finish."
          return
        }

        if (event.type === "message.part.updated") {
          const task = tasks.get(event.properties.part.sessionID)
          if (!task || task.status !== "running") return
          const part = event.properties.part
          if (part.type === "text" && part.text.trim()) task.progress = compact(part.text)
          if (part.type === "tool" && part.state.status === "running") {
            task.progress = part.state.title || `Using ${part.tool}.`
          }
          return
        }

        if (event.type === "session.error") {
          const task = event.properties.sessionID ? tasks.get(event.properties.sessionID) : undefined
          if (!task || task.status !== "running") return
          task.status = "error"
          task.error = event.properties.error?.data?.message || "The child conversation failed."
          task.finishedAt = Date.now()
          task.progress = task.error
          void reportToParent(task).catch(() => {})
          return
        }

        if (event.type === "session.idle") {
          const task = tasks.get(event.properties.sessionID)
          if (!task || task.status !== "running") return
          void finish(task).catch(() => {})
        }
      },
    }
  },
}

function compact(value) {
  return value.replace(/\s+/g, " ").trim().slice(-320)
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}
