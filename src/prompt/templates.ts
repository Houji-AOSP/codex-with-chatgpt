/**
 * C2C standard prompt templates for ChatGPT (Web) and coding agents (Codex / Antigravity).
 * Reference: docs/protocol.md
 */

export const BOOT_PROMPT = `You are the planning and review layer of an AI coding session (Antigravity / Codex).

You own high-level reasoning, planning and review.
The local coding agent owns execution (files, git, tests, terminal commands).

You have access to the current local workspace through the "Codex with ChatGPT" MCP connector.

Rules:
1. Do not ask the agent to paste files that are available through MCP.
2. Inspect only the files needed for the task via MCP.
3. Use MCP to inspect current code, git status and diff.
4. Produce concise executable plans.
5. The local agent will execute your plan using its own harness.
6. After the agent reports EXECUTED, independently inspect the diff via git_diff.
   If execution_output lists a readable item for this iteration, list then read it.
7. Do not assume an implementation succeeded just because the agent says so.
8. Return C2C structured control messages ([C2C] STATE: PLAN / DONE / BLOCKED).
9. Substance over length: explain why, which file, and what to test.`;

export const PROJECT_INSTRUCTIONS_TEMPLATE = `You are the planning and review layer for one local workspace. The local agent (Antigravity / Codex) executes.

This Project is bound only to:
- Workspace name: {{workspace_name}}
- Kind: {{project_type}} ({{languages}} / {{frameworks}})
- Connector (use this one only): {{connector_name}}

When you call tools, use ONLY that connector. Do not use any other
Codex with ChatGPT connector. If workspace_info names a different
workspace, stop. Do not plan. Do not use this Project's memory.

Read code, git, diffs, and any released command output through that
connector. Never ask anyone to paste file bodies, diffs, or logs. After
EXECUTED, call execution_output (list, then read) when a readable item
exists; if status is restricted, review from git instead. Never upload
the repo into this Project's files or sources.

When facts conflict, trust this order:
1. Current code from the connector
2. A HANDOFF in this chat (this task's goal, progress, next step)
3. These instructions
4. This Project's memory (durable architecture only; stale memory loses)

This Project's memory is only for this workspace. On HANDOFF, trust the
brief, re-read code through the connector, and resume at NEXT_EXPECTED_STEP.

Be substantive: why, which file, what to test. No empty one-liners and
no 40-step epics. Use C2C control messages.`;

export interface InitPromptOptions {
  taskId: string;
  iteration?: number;
  goal: string;
  connectorName?: string;
  instruction?: string;
}

export function buildInitPrompt(opts: InitPromptOptions): string {
  const iter = opts.iteration ?? 0;
  const connector = opts.connectorName ?? "Codex with ChatGPT";
  const defaultInstruction = `Inspect the connected workspace through MCP (${connector}).\nCreate an implementation plan for the local coding agent.`;
  return [
    "[C2C]",
    "STATE: INIT",
    `TASK_ID: ${opts.taskId}`,
    `ITERATION: ${iter}`,
    "",
    "GOAL:",
    opts.goal.trim(),
    "",
    "INSTRUCTION:",
    (opts.instruction ?? defaultInstruction).trim(),
  ].join("\n");
}

export interface ExecutedPromptOptions {
  taskId: string;
  iteration: number;
  changedFiles?: number;
  tests?: string;
  exitStatus?: string;
  summary?: string;
}

export function buildExecutedPrompt(opts: ExecutedPromptOptions): string {
  const result = opts.summary?.trim() || `Execution finished with exit status: ${opts.exitStatus ?? "ok"}.`;
  return [
    "[C2C]",
    "STATE: EXECUTED",
    `TASK_ID: ${opts.taskId}`,
    `ITERATION: ${opts.iteration}`,
    "",
    "RESULT:",
    result,
    "",
    "CHANGED_FILES:",
    String(opts.changedFiles ?? 0),
    "",
    "TESTS:",
    opts.tests?.trim() || "all tests passing",
    "",
    "Please independently inspect the workspace and current git diff through MCP.",
    "If execution_output lists a readable item for this iteration, list then read it.",
    "If status is restricted, ignore it and review from git_diff.",
  ].join("\n");
}

export interface HandoffPromptOptions {
  taskId: string;
  iteration: number;
  goal: string;
  progress: string;
  currentState: string;
  knownIssues?: string;
  nextStep: string;
}

export function buildHandoffPrompt(opts: HandoffPromptOptions): string {
  return [
    "[C2C]",
    "STATE: HANDOFF",
    `TASK_ID: ${opts.taskId}`,
    `ITERATION: ${opts.iteration}`,
    "",
    "ORIGINAL_GOAL:",
    opts.goal.trim(),
    "",
    "PROGRESS:",
    opts.progress.trim(),
    "",
    "CURRENT_STATE:",
    opts.currentState.trim(),
    "",
    "KNOWN_ISSUES:",
    opts.knownIssues?.trim() || "None",
    "",
    "NEXT_EXPECTED_STEP:",
    opts.nextStep.trim(),
  ].join("\n");
}
