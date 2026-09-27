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
6. **ALWAYS use the `chatgpt-browser` MCP tools (Playwright) to interact with ChatGPT Web automatically.** Never just print prompts to screen.

## Locations
- The codex-with-chatgpt checkout lives at: `<ACTUAL_CHECKOUT_PATH>`
- CLI runner: `node "<checkout>/bin/c2c.js" <command>` (or `c2c <command>` if globally installed).
- All commands support `--json` for machine-readable JSON output.
- Workspace flag: pass `-w <workspace root>` for workspace-scoped commands.

## How to Interact with ChatGPT Web (AUTOMATIC via Playwright MCP)

You have a `chatgpt-browser` MCP server that provides Playwright browser tools.
The browser profile at `~/.local/share/chatgpt-browser-profile` persists login sessions.

### Browser tools you MUST use:
- `browser_navigate` — navigate to a URL (e.g. ChatGPT chat page)
- `browser_type` — type text into the chat input
- `browser_click` — click elements (e.g. send button)
- `browser_snapshot` — take an accessibility snapshot to read ChatGPT's reply
- `browser_wait_for_text` — wait for specific text to appear on page

### Workflow to send a message to ChatGPT and read the reply:

1. **Navigate** to the ChatGPT conversation:
   ```
   browser_navigate → url: "https://chatgpt.com/" (or saved session URL)
   ```

2. **Check login**: Take a `browser_snapshot`. If you see a login page, tell the user:
   "Hãy đăng nhập ChatGPT trong cửa sổ trình duyệt vừa mở, xong bảo tôi 'ok'."
   Wait for the user to confirm, then continue.

3. **Type the prompt** into the chat input:
   ```
   browser_click → element: the chat input textarea (aria: "Message ChatGPT" or "Send a message")
   browser_type → text: <the C2C prompt>
   ```

4. **Send** the message:
   ```
   browser_click → element: the send button
   ```

5. **Wait and read** ChatGPT's reply:
   - Wait 10-30 seconds for generation.
   - Use `browser_snapshot` to read the page.
   - Look for `[C2C]` or `STATE:` in the response text.
   - If ChatGPT is still generating (spinner visible, "Stop generating" button present),
     wait another 15 seconds and snapshot again. Repeat until done.

6. **Parse** the reply: extract `STATE: PLAN`, `STATE: DONE`, `STATE: BLOCKED`, etc.

### IMPORTANT: Never print prompts to screen and ask user to copy-paste!
Always use the browser tools above to send prompts directly to ChatGPT Web.
Only involve the user for: login, CAPTCHA, 2FA, or manual connector setup.

## Workflow: First-Time Setup

1. Detect prerequisites: `node --version` (>= 20) and `cloudflared`.
2. Run `node "<checkout>/bin/c2c.js" sandbox-allow --json` to whitelist workspace.
3. Run `node "<checkout>/bin/c2c.js" setup -w <workspace> --json`.
   Returns `{ mcpUrl, pairingCode, workspaceName, connectorName }`.
4. **Use browser tools** to configure ChatGPT Connector:
   a. `browser_navigate` → `https://chatgpt.com/#settings/Security`
      Check if Developer Mode is on. If not, enable it.
   b. `browser_navigate` → `https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins`
   c. Fill in connector fields:
      - Name: the `connectorName` from setup
      - Description: `Securely connect ChatGPT to the current workspace for planning and review.`
      - Server URL: the `mcpUrl` from setup
      - Authentication: OAuth
   d. Click Connect/Authorize.
   e. Run `node "<checkout>/bin/c2c.js" pair -w <workspace> --json` → get pairing code.
   f. Type the pairing code into the browser.
5. Open a new ChatGPT chat and send the boot prompt (see below).
6. Send workspace_info verification:
   `Use the "<connectorName>" connector: call workspace_info and read hello-style top-level file. Reply with the workspace name.`
7. Verify reply matches workspaceName.
8. Save session:
   `node "<checkout>/bin/c2c.js" session set -w <workspace> --mode project --url <chat_url> --connector-name "<connectorName>"`
9. Report to user:
   ```
   Antigravity with ChatGPT

   ✓ Đã nhận diện dự án
   ✓ Workspace Bridge đã khởi động
   ✓ Kết nối bảo mật đã thiết lập
   ✓ ChatGPT đã kết nối
   ✓ Test đọc file đã pass

   Ready.
   ```

## Boot Prompt (send to ChatGPT at start of each conversation)

```
You are the planning and review layer of an AI coding session.

The local coding agent owns execution (files, git, tests, terminal commands).
You own high-level reasoning, planning and review.

You have access to the current local workspace through the MCP connector.

Rules:
1. Do not ask the agent to paste files that are available through MCP.
2. Inspect only the files needed for the task via MCP.
3. Use MCP to inspect current code, git status and diff.
4. Produce concise executable plans.
5. After the agent reports EXECUTED, independently inspect the diff via git_diff.
6. Do not assume an implementation succeeded just because the agent says so.
7. Return C2C structured control messages ([C2C] STATE: PLAN / DONE / BLOCKED).
8. Be substantive: explain why, which file, and what to test.
```

## Workflow: Coding Task

1. Run pre-flight:
   `node "<checkout>/bin/c2c.js" doctor -w <workspace> --json`
2. Get session info:
   `node "<checkout>/bin/c2c.js" session -w <workspace> --json`
3. **Navigate browser** to saved ChatGPT URL (or open new chat if none).
4. **Generate and send INIT** to ChatGPT via browser:
   ```
   [C2C]
   STATE: INIT
   TASK_ID: c2c_<random 4 hex>
   ITERATION: 0

   GOAL:
   <user's goal>

   INSTRUCTION:
   Inspect the connected workspace through MCP.
   Create an implementation plan for the local coding agent.
   ```
   Use `browser_click` + `browser_type` + `browser_click` (send button).

5. **Wait and read** ChatGPT's `[C2C] STATE: PLAN` reply using `browser_snapshot`.
   Parse the PLAN: extract ACTIONS, FILES_LIKELY_INVOLVED, TESTS, SUCCESS_CRITERIA.

6. **Execute locally**: Apply edits with file tools, run commands, run tests.

7. **Record execution**:
   `node "<checkout>/bin/c2c.js" record -w <workspace> --task <id> --iteration <n> --changed-files <k> --tests "<passed>" --exit-status ok`

8. **Send EXECUTED** to ChatGPT via browser:
   ```
   [C2C]
   STATE: EXECUTED
   TASK_ID: <id>
   ITERATION: <n>

   RESULT:
   Execution finished.

   CHANGED_FILES:
   <count>

   TESTS:
   <summary>

   Please independently inspect the workspace and current git diff through MCP.
   ```

9. **Wait and read** ChatGPT's review reply.
   - `STATE: PLAN` → go back to step 6 (next iteration).
   - `STATE: DONE` → report success to user.
   - `STATE: BLOCKED` → report the issue to user.

10. Loop until DONE or max iterations (12).
