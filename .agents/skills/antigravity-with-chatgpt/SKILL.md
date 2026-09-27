---
name: antigravity-with-chatgpt
description: >
  Use ChatGPT (web) as the planning and review brain for Antigravity CLI coding sessions,
  while Antigravity keeps full execution ownership. Use when the user says
  "Use ChatGPT to plan...", "Dùng ChatGPT để lên kế hoạch...", "Antigravity with ChatGPT",
  "Set up Antigravity with ChatGPT", or when asking to connect ChatGPT Web to the current workspace.
---

# Antigravity with ChatGPT

ChatGPT thinks. Antigravity works.

Antigravity owns execution: editing files, running bash commands, git diff, testing, recovery.
ChatGPT owns high-level reasoning: architectural understanding, planning, code review.
The C2C Bridge gives ChatGPT read-only MCP access to the current workspace over a secure tunnel.

## Golden Rules
1. NEVER paste full file contents, diffs, or logs into ChatGPT. ChatGPT reads them through MCP.
2. NEVER show the user technical internals (MCP, OAuth, PKCE, tunnel, ports, localhost) unless needed for guided manual pairing.
3. The pairing code is the ONLY credential ever entered into ChatGPT Web.
4. Keep control messages tiny (< 1 KB) using the `[C2C]` protocol format.
5. If something fails, run `c2c doctor -w <workspace>` and repair silently.

## Locations
- The codex-with-chatgpt checkout lives at: `/home/jiro/codex-with-chatgpt`
- CLI runner: `node "<checkout>/bin/c2c.js" <command>` (or `c2c <command>` if globally installed).
- All commands support `--json` for machine-readable JSON output.
- Workspace flag: pass `-w <workspace root>` for workspace-scoped commands (`setup`, `doctor`, `session`, `prompt`, `record`, `status`, `logs`).

## How to Interact with ChatGPT Web
Antigravity CLI can communicate with ChatGPT Web in two ways:
1. **Interactive / Assisted Mode (Default for Antigravity CLI)**:
   - Use `c2c prompt init -w <workspace> --goal "<goal>"` to generate the exact protocol message.
   - Use `c2c session open -w <workspace>` to launch the ChatGPT chat in the system browser.
   - Present the formatted prompt block to the user so they can submit it in ChatGPT Web.
   - Wait for the user to provide ChatGPT's `[C2C] STATE: PLAN` reply.
   - Autonomously execute the plan using `replace_file_content`, `write_to_file`, `run_command`.
   - Run tests and record the iteration via `c2c record`.
   - Generate `c2c prompt executed -w <workspace> --task <id> --iteration <n>` and ask ChatGPT to review via MCP `git_diff`.
   - Conclude when ChatGPT replies with `[C2C] STATE: DONE`.
2. **Browser MCP Mode (If browser tool / MCP is configured)**:
   - If a browser MCP (like Playwright / Puppeteer MCP) is connected in Antigravity, navigate directly to `session.url` or `conversation.projectUrl`, paste the prompt, and wait for DOM generation to complete.

## Workflow: First-Time Setup
1. Detect prerequisites: `node --version` (>= 20) and `cloudflared`.
2. Run `c2c sandbox-allow --json` to ensure Antigravity settings and workspace are allowlisted.
3. Run `c2c setup -w <workspace> --json`.
   Returns `{ mcpUrl, pairingCode, workspaceName, connectorName }`.
4. Instruct the user to configure the ChatGPT Connector:
   - Open: `https://chatgpt.com/plugins#settings/Connectors?create-connector=true`
   - Server URL: the `mcpUrl` from setup
   - Authentication: OAuth
   - Enter Pairing Code from `c2c pair -w <workspace> --json`
5. Open the ChatGPT chat or Project and send the boot prompt:
   Run `c2c prompt boot` and send it to ChatGPT.
6. Verify: ask ChatGPT to call `workspace_info` via the connector.
7. Save session:
   `c2c session set -w <workspace> --mode project --url <chat_url> --connector-name "<connectorName>"`
8. Report checklist to the user:
   ```
   Antigravity with ChatGPT

   ✓ Workspace identified
   ✓ Workspace Bridge started
   ✓ Secure tunnel established
   ✓ ChatGPT connected
   ✓ File read test passed

   Ready.
   ```

## Workflow: Coding Task
1. Run pre-flight check:
   `c2c doctor -w <workspace> --json`
2. Check or create task ID:
   `c2c session -w <workspace> --json`
3. Generate the INIT prompt:
   `c2c prompt init -w <workspace> --goal "<user goal>"`
4. Submit to ChatGPT Web and receive `[C2C] STATE: PLAN`.
5. Execute plan locally:
   - Apply edits with file tools.
   - Run test commands via `run_command`.
   - Verify git status.
6. Record execution locally:
   `c2c record -w <workspace> --task <id> --iteration <n> --changed-files <k> --tests "<passed>" --exit-status ok`
7. Generate EXECUTED review prompt:
   `c2c prompt executed -w <workspace> --task <id> --iteration <n>`
8. ChatGPT reviews `git_diff` through MCP and replies `[C2C] STATE: DONE` or next `PLAN`.
