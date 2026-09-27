import { spawn } from "node:child_process";

export function openBrowserUrl(url: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    let cmd: string;
    let args: string[];

    if (process.platform === "darwin") {
      cmd = "open";
      args = [url];
    } else if (process.platform === "win32") {
      cmd = "cmd.exe";
      args = ["/c", "start", '""', url];
    } else {
      cmd = "xdg-open";
      args = [url];
    }

    try {
      const child = spawn(cmd, args, {
        stdio: "ignore",
        windowsHide: true,
        detached: true,
      });
      child.on("error", (err) => {
        resolve({ ok: false, error: err.message });
      });
      child.unref();
      // Assume success after launch if no immediate error
      setTimeout(() => resolve({ ok: true }), 200);
    } catch (err) {
      resolve({ ok: false, error: (err as Error).message });
    }
  });
}
