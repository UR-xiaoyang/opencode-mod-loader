# Parallel Conversations MOD

This MOD adds four model-callable tools:

- `parallel_tasks`: launch one to eight independent child conversations concurrently.
- `parallel_status`: inspect each child task's current progress.
- `parallel_collect`: retrieve completed reports on demand.
- `parallel_cancel`: stop running child tasks.

Each child is created as a child session of the conversation that launched it and uses the same selected model. Child sessions have the MOD's parallel tools disabled, so they cannot recursively create more parallel work.

When a child session becomes idle, the MOD reads its final text report and posts it back into the primary session as a synthetic message. The primary model receives that report, determines any next work, and creates the final user-facing synthesis. The MOD never produces the final response itself.

## Install

Copy the `parallel-conversations` directory into OpenCode's MOD folder, then use **Settings > MODs** to refresh and enable it. Enabling this MOD restarts the local Desktop sidecar because it uses the trusted `server.host` permission.

## Notes

- Each active Desktop sidecar keeps the task registry in memory. Restarting the sidecar does not stop existing sessions, but it does stop automatic progress tracking and report delivery for tasks launched before the restart.
- The MOD is intended for independent tasks. Concurrent child conversations can edit the same workspace, so prompts should assign separate files or clearly non-overlapping responsibilities.
