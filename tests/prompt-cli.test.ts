import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binC2c = path.join(repoRoot, "bin", "c2c.js");

function runC2c(args: string[]): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [binC2c, ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env },
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err: any) {
    return {
      status: err.status ?? 1,
      stdout: err.stdout?.toString() ?? "",
      stderr: err.stderr?.toString() ?? "",
    };
  }
}

describe("c2c prompt CLI", () => {
  it("generates boot prompt with --json", () => {
    const { status, stdout } = runC2c(["prompt", "boot", "--json"]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.prompt).toContain("You are the planning and review layer");
  });

  it("generates init prompt with required goal", () => {
    const { status, stdout } = runC2c([
      "prompt",
      "init",
      "--goal",
      "Add user authentication",
      "--task",
      "c2c_test01",
      "--json",
    ]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.taskId).toBe("c2c_test01");
    expect(parsed.prompt).toContain("[C2C]");
    expect(parsed.prompt).toContain("STATE: INIT");
    expect(parsed.prompt).toContain("TASK_ID: c2c_test01");
    expect(parsed.prompt).toContain("Add user authentication");
  });

  it("generates executed prompt with changed files and tests", () => {
    const { status, stdout } = runC2c([
      "prompt",
      "executed",
      "--task",
      "c2c_test01",
      "--iteration",
      "1",
      "--changed-files",
      "3",
      "--tests",
      "12 passed",
      "--json",
    ]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.prompt).toContain("STATE: EXECUTED");
    expect(parsed.prompt).toContain("CHANGED_FILES:\n3");
    expect(parsed.prompt).toContain("TESTS:\n12 passed");
  });

  it("generates handoff prompt for continuation", () => {
    const { status, stdout } = runC2c([
      "prompt",
      "handoff",
      "--goal",
      "Implement feature",
      "--progress",
      "Step 1 done",
      "--state",
      "EXECUTED",
      "--next-step",
      "Review git diff",
      "--task",
      "c2c_test01",
      "--json",
    ]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.prompt).toContain("STATE: HANDOFF");
    expect(parsed.prompt).toContain("ORIGINAL_GOAL:\nImplement feature");
    expect(parsed.prompt).toContain("PROGRESS:\nStep 1 done");
    expect(parsed.prompt).toContain("NEXT_EXPECTED_STEP:\nReview git diff");
  });
});
