import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getStateDir } from "./paths.js";

const TABLE = "sandbox_workspace_write";
const KEY = "writable_roots";

export interface AntigravityAllowResult {
  added: boolean;
  alreadyAllowed: boolean;
  configPath: string;
}

export interface SandboxAllowResult {
  added: boolean;
  alreadyAllowed: boolean;
  stateDir: string;
  configPath: string;
  antigravity?: AntigravityAllowResult;
}

export function getCodexHome(): string {
  const fromEnv = process.env.CODEX_HOME?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(os.homedir(), ".codex");
}

export function getCodexConfigPath(): string {
  return path.join(getCodexHome(), "config.toml");
}

export function getAntigravityHome(): string {
  const fromEnv = process.env.ANTIGRAVITY_HOME?.trim() || process.env.GEMINI_HOME?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(os.homedir(), ".gemini");
}

export function getAntigravitySettingsPath(): string {
  return path.join(getAntigravityHome(), "antigravity-cli", "settings.json");
}

/** POSIX slashes are valid in TOML and accepted by Codex on Windows. */
export function toTomlPath(p: string): string {
  if (/^[a-zA-Z]:[\\/]/.test(p) || p.startsWith("\\\\")) return p.replace(/\\/g, "/");
  return path.resolve(p).replace(/\\/g, "/");
}

export function pathsEquivalent(a: string, b: string): boolean {
  const left = normalizeCompare(a);
  const right = normalizeCompare(b);
  if (isWindowsStyle(a) || isWindowsStyle(b)) return left.toLowerCase() === right.toLowerCase();
  return left === right;
}

export function listWritableRoots(content: string): string[] {
  const table = findTable(content, TABLE);
  if (!table) return [];
  const assignment = findArrayAssignment(table.body, KEY);
  return assignment ? parseTomlStringArray(assignment.rawArray) : [];
}

export function isStateDirAllowlisted(content: string, stateDir: string): boolean {
  return listWritableRoots(content).some((root) => pathsEquivalent(root, stateDir));
}

/**
 * Idempotently add workspace root and C2C state dir to Antigravity CLI's trustedWorkspaces.
 */
export function ensureAntigravityAllowlist(opts?: {
  settingsPath?: string;
  workspaceRoot?: string;
  stateDir?: string;
}): AntigravityAllowResult {
  const settingsPath = opts?.settingsPath ?? getAntigravitySettingsPath();
  const stateDir = path.resolve(opts?.stateDir ?? getStateDir());
  const workspaceRoot = path.resolve(opts?.workspaceRoot ?? process.cwd());

  if (fs.existsSync(settingsPath)) {
    try {
      const raw = fs.readFileSync(settingsPath, "utf8");
      const data = JSON.parse(raw);
      if (!Array.isArray(data.trustedWorkspaces)) {
        data.trustedWorkspaces = [];
      }
      let changed = false;
      const candidates = [workspaceRoot, stateDir];
      for (const candidate of candidates) {
        if (!data.trustedWorkspaces.some((w: string) => pathsEquivalent(w, candidate))) {
          data.trustedWorkspaces.push(candidate);
          changed = true;
        }
      }
      if (data.allowNonWorkspaceAccess !== true) {
        data.allowNonWorkspaceAccess = true;
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2) + "\n", "utf8");
        return { added: true, alreadyAllowed: false, configPath: settingsPath };
      }
      return { added: false, alreadyAllowed: true, configPath: settingsPath };
    } catch {
      // JSON parse error or read error; fallback below
    }
  }

  // File does not exist yet or was unparseable
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true, mode: 0o700 });
  const initial = {
    allowNonWorkspaceAccess: true,
    trustedWorkspaces: [workspaceRoot, stateDir],
  };
  fs.writeFileSync(settingsPath, JSON.stringify(initial, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  return { added: true, alreadyAllowed: false, configPath: settingsPath };
}

/**
 * Idempotently add the C2C state directory to Codex's sandbox writable_roots
 * and (when present) Antigravity CLI's trustedWorkspaces.
 * Works on macOS, Windows, and Linux. Never rewrites unrelated config.
 */
export function ensureSandboxAllowlist(opts?: {
  configPath?: string;
  stateDir?: string;
  antigravitySettingsPath?: string;
  workspaceRoot?: string;
}): SandboxAllowResult {
  const stateDir = path.resolve(opts?.stateDir ?? getStateDir());
  const configPath = opts?.configPath ?? getCodexConfigPath();
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.dirname(configPath), { recursive: true, mode: 0o700 });

  const previous = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";
  let codexAdded = false;
  let codexAlreadyAllowed = false;

  if (isStateDirAllowlisted(previous, stateDir)) {
    codexAlreadyAllowed = true;
  } else {
    const next = upsertWritableRoot(previous, stateDir);
    fs.writeFileSync(configPath, next, { encoding: "utf8", mode: 0o600 });
    try {
      fs.chmodSync(configPath, 0o600);
    } catch {
      // Windows / filesystems without chmod semantics
    }
    codexAdded = true;
  }

  // Antigravity allowlist (only if explicitly requested via options, or if default runtime and Antigravity is detected)
  let antigravity: AntigravityAllowResult | undefined;
  const shouldCheckAntigravity =
    opts?.antigravitySettingsPath != null ||
    (opts?.configPath == null && (fs.existsSync(getAntigravitySettingsPath()) || fs.existsSync(getAntigravityHome())));

  if (shouldCheckAntigravity) {
    try {
      antigravity = ensureAntigravityAllowlist({
        settingsPath: opts?.antigravitySettingsPath,
        stateDir,
        workspaceRoot: opts?.workspaceRoot,
      });
    } catch {
      // Ignore Antigravity error if Codex already succeeded
    }
  }

  return {
    added: codexAdded || (antigravity?.added ?? false),
    alreadyAllowed: codexAlreadyAllowed && (antigravity ? antigravity.alreadyAllowed : true),
    stateDir,
    configPath,
    antigravity,
  };
}

export function upsertWritableRoot(content: string, stateDir: string): string {
  const tomlPath = toTomlPath(stateDir);
  if (isStateDirAllowlisted(content, stateDir)) return content;

  const table = findTable(content, TABLE);
  if (!table) {
    const prefix = content.length === 0 ? "" : content.endsWith("\n") ? content : `${content}\n`;
    const spacer = prefix.length === 0 || prefix.endsWith("\n\n") ? "" : "\n";
    return `${prefix}${spacer}[${TABLE}]\n${KEY} = ["${escapeTomlString(tomlPath)}"]\n`;
  }

  const assignment = findArrayAssignment(table.body, KEY);
  if (!assignment) {
    const insertAt = table.start + firstLineLength(table.body);
    const line = `${KEY} = ["${escapeTomlString(tomlPath)}"]\n`;
    return content.slice(0, insertAt) + line + content.slice(insertAt);
  }

  const roots = parseTomlStringArray(assignment.rawArray);
  const nextRoots = [...roots, tomlPath];
  const multiline = assignment.rawArray.includes("\n");
  const rendered = multiline
    ? `[\n${nextRoots.map((root) => `  "${escapeTomlString(toTomlPath(root))}"`).join(",\n")},\n]`
    : `[${nextRoots.map((root) => `"${escapeTomlString(toTomlPath(root))}"`).join(", ")}]`;

  const absStart = table.start + assignment.start;
  const absEnd = table.start + assignment.end;
  return content.slice(0, absStart) + `${KEY} = ${rendered}` + content.slice(absEnd);
}

function normalizeCompare(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+$/, "");
}

function isWindowsStyle(p: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(p) || p.includes("\\");
}

function escapeTomlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function findTable(content: string, name: string): { start: number; end: number; body: string } | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^[ \\t]*\\[${escaped}\\][ \\t]*$`, "m").exec(content);
  if (!match) return null;
  const start = match.index;
  const afterHeader = start + match[0].length;
  const rest = content.slice(afterHeader);
  const next = /^[ \t]*\[[^\]]+\][ \t]*$/m.exec(rest);
  const end = next ? afterHeader + next.index : content.length;
  return { start, end, body: content.slice(start, end) };
}

function findArrayAssignment(
  tableBody: string,
  key: string
): { start: number; end: number; rawArray: string } | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^[ \\t]*${escaped}[ \\t]*=[ \\t]*(\\[[\\s\\S]*?\\])`, "m").exec(tableBody);
  if (!match) return null;
  return {
    start: match.index,
    end: match.index + match[0].length,
    rawArray: match[1],
  };
}

function parseTomlStringArray(src: string): string[] {
  const values: string[] = [];
  const re = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src))) {
    const raw = match[1] ?? match[2] ?? "";
    values.push(raw.replace(/\\(.)/g, "$1"));
  }
  return values;
}

function firstLineLength(text: string): number {
  const newline = text.indexOf("\n");
  return newline === -1 ? text.length : newline + 1;
}
