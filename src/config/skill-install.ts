import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCodexHome, getAntigravityHome } from "./sandbox-allow.js";

export type SkillTarget = "all" | "codex" | "antigravity";
export type SkillScope = "all" | "global" | "workspace";

export interface SkillInstallOptions {
  checkoutPath?: string;
  target?: SkillTarget;
  scope?: SkillScope;
  workspaceRoot?: string;
  codexHome?: string;
  antigravityHome?: string;
}

export interface SkillInstallLocation {
  agent: "codex" | "antigravity";
  scope: "global" | "workspace";
  destFile: string;
}

export interface SkillInstallResult {
  ok: boolean;
  installed: SkillInstallLocation[];
  errors: string[];
}

export function getDefaultRepoRoot(): string {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    return path.resolve(path.dirname(currentFile), "..", "..");
  } catch {
    return process.cwd();
  }
}

export function installSkills(opts?: SkillInstallOptions): SkillInstallResult {
  const repoRoot = path.resolve(opts?.checkoutPath ?? getDefaultRepoRoot());
  const target = opts?.target ?? "all";
  const scope = opts?.scope ?? "all";
  const codexHome = opts?.codexHome ?? getCodexHome();
  const antigravityHome = opts?.antigravityHome ?? getAntigravityHome();
  const workspaceRoot = opts?.workspaceRoot ? path.resolve(opts.workspaceRoot) : undefined;

  const codexTemplatePath = path.join(repoRoot, "skill", "SKILL.md");
  const agyTemplatePath = path.join(repoRoot, "skill", "antigravity", "SKILL.md");

  const codexContent = fs.existsSync(codexTemplatePath)
    ? fs.readFileSync(codexTemplatePath, "utf8").replace(/<ACTUAL_CHECKOUT_PATH>/g, repoRoot)
    : null;

  const agyContent = fs.existsSync(agyTemplatePath)
    ? fs.readFileSync(agyTemplatePath, "utf8").replace(/<ACTUAL_CHECKOUT_PATH>/g, repoRoot)
    : codexContent;

  const installed: SkillInstallLocation[] = [];
  const errors: string[] = [];

  const writeSkill = (agent: "codex" | "antigravity", sc: "global" | "workspace", dest: string, content: string | null) => {
    if (!content) {
      errors.push(`Template for ${agent} not found`);
      return;
    }
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o755 });
      fs.writeFileSync(dest, content, { encoding: "utf8", mode: 0o644 });
      installed.push({ agent, scope: sc, destFile: dest });
    } catch (err) {
      errors.push(`Failed to install to ${dest}: ${(err as Error).message}`);
    }
  };

  // 1. Codex
  if (target === "all" || target === "codex") {
    if (scope === "all" || scope === "global") {
      const dest = path.join(codexHome, "skills", "codex-with-chatgpt", "SKILL.md");
      writeSkill("codex", "global", dest, codexContent);
    }
  }

  // 2. Antigravity
  if (target === "all" || target === "antigravity") {
    if (scope === "all" || scope === "global") {
      // Install as antigravity-with-chatgpt and codex-with-chatgpt in Antigravity global
      const dest1 = path.join(antigravityHome, "config", "skills", "antigravity-with-chatgpt", "SKILL.md");
      writeSkill("antigravity", "global", dest1, agyContent);

      const dest2 = path.join(antigravityHome, "config", "skills", "codex-with-chatgpt", "SKILL.md");
      writeSkill("antigravity", "global", dest2, agyContent);
    }

    if (workspaceRoot && (scope === "all" || scope === "workspace")) {
      const destWs = path.join(workspaceRoot, ".agents", "skills", "antigravity-with-chatgpt", "SKILL.md");
      writeSkill("antigravity", "workspace", destWs, agyContent);
    }
  }

  return {
    ok: errors.length === 0,
    installed,
    errors,
  };
}
