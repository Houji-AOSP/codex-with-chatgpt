import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  ensureAntigravityAllowlist,
  ensureSandboxAllowlist,
} from "../src/config/sandbox-allow.js";
import { makeTmpDir, cleanup } from "./helpers.js";

describe("antigravity sandbox allowlist", () => {
  it("creates settings.json with trustedWorkspaces and allowNonWorkspaceAccess", () => {
    const dir = makeTmpDir("agy-sandbox-create");
    const settingsPath = path.join(dir, "settings.json");
    const workspaceRoot = path.join(dir, "workspace");
    const stateDir = path.join(dir, "state");

    const result = ensureAntigravityAllowlist({
      settingsPath,
      workspaceRoot,
      stateDir,
    });

    expect(result.added).toBe(true);
    expect(result.alreadyAllowed).toBe(false);
    expect(fs.existsSync(settingsPath)).toBe(true);

    const data = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    expect(data.allowNonWorkspaceAccess).toBe(true);
    expect(data.trustedWorkspaces).toContain(workspaceRoot);
    expect(data.trustedWorkspaces).toContain(stateDir);

    cleanup(dir);
  });

  it("updates existing settings.json without losing other settings", () => {
    const dir = makeTmpDir("agy-sandbox-update");
    const settingsPath = path.join(dir, "settings.json");
    const workspaceRoot = path.join(dir, "workspace");
    const stateDir = path.join(dir, "state");

    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          model: "gemini-3.8-flash-high",
          trustedWorkspaces: ["/other/project"],
        },
        null,
        2
      )
    );

    const result = ensureAntigravityAllowlist({
      settingsPath,
      workspaceRoot,
      stateDir,
    });

    expect(result.added).toBe(true);
    const data = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    expect(data.model).toBe("gemini-3.8-flash-high");
    expect(data.trustedWorkspaces).toContain("/other/project");
    expect(data.trustedWorkspaces).toContain(workspaceRoot);
    expect(data.trustedWorkspaces).toContain(stateDir);
    expect(data.allowNonWorkspaceAccess).toBe(true);

    // Idempotent test
    const second = ensureAntigravityAllowlist({
      settingsPath,
      workspaceRoot,
      stateDir,
    });
    expect(second.added).toBe(false);
    expect(second.alreadyAllowed).toBe(true);

    cleanup(dir);
  });

  it("ensureSandboxAllowlist updates both Codex config and Antigravity settings when provided", () => {
    const dir = makeTmpDir("both-sandbox");
    const configPath = path.join(dir, "config.toml");
    const settingsPath = path.join(dir, "settings.json");
    const stateDir = path.join(dir, "state");
    const workspaceRoot = path.join(dir, "workspace");

    const result = ensureSandboxAllowlist({
      configPath,
      stateDir,
      antigravitySettingsPath: settingsPath,
      workspaceRoot,
    });

    expect(result.added).toBe(true);
    expect(result.antigravity).toBeDefined();
    expect(result.antigravity?.added).toBe(true);
    expect(fs.existsSync(configPath)).toBe(true);
    expect(fs.existsSync(settingsPath)).toBe(true);

    cleanup(dir);
  });
});
