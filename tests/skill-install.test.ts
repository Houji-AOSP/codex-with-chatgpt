import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { installSkills } from "../src/config/skill-install.js";
import { makeTmpDir, cleanup } from "./helpers.js";

describe("skill install", () => {
  it("installs skill for codex with actual checkout path", () => {
    const dir = makeTmpDir("skill-install-codex");
    const codexHome = path.join(dir, ".codex");
    const antigravityHome = path.join(dir, ".gemini");

    const result = installSkills({
      target: "codex",
      scope: "global",
      codexHome,
      antigravityHome,
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.installed).toHaveLength(1);

    const installedFile = result.installed[0].destFile;
    expect(fs.existsSync(installedFile)).toBe(true);
    const text = fs.readFileSync(installedFile, "utf8");
    expect(text).not.toContain("<ACTUAL_CHECKOUT_PATH>");
    expect(text).toContain("bin/c2c.js");

    cleanup(dir);
  });

  it("installs skill for antigravity in global and workspace locations", () => {
    const dir = makeTmpDir("skill-install-antigravity");
    const codexHome = path.join(dir, ".codex");
    const antigravityHome = path.join(dir, ".gemini");
    const workspaceRoot = path.join(dir, "my-workspace");

    const result = installSkills({
      target: "antigravity",
      scope: "all",
      codexHome,
      antigravityHome,
      workspaceRoot,
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    // Should install antigravity-with-chatgpt (global), codex-with-chatgpt (global), and workspace skill
    expect(result.installed.length).toBeGreaterThanOrEqual(2);

    for (const item of result.installed) {
      expect(fs.existsSync(item.destFile)).toBe(true);
      const text = fs.readFileSync(item.destFile, "utf8");
      expect(text).not.toContain("<ACTUAL_CHECKOUT_PATH>");
    }

    const wsSkill = path.join(workspaceRoot, ".agents", "skills", "antigravity-with-chatgpt", "SKILL.md");
    expect(fs.existsSync(wsSkill)).toBe(true);

    cleanup(dir);
  });
});
