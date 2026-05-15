#!/usr/bin/env python3
"""
Backend auto-restart script - watches for file changes and restarts uvicorn.
"""
import sys
import time
import signal
import subprocess
import os
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

BACKEND_DIR = Path("/home/nhannv/Hello/TrinhHao/TravelGPT/backend")
UVICORN_PORT = "3008"
IGNORE_DIRS = {"__pycache__", ".git", "node_modules", ".venv", "venv", "prisma/.venv"}
IGNORE_FILES = {".DS_Store"}


class RestartHandler(FileSystemEventHandler):
    def __init__(self, on_restart):
        self.on_restart = on_restart
        self.last_restart = 0
        self.restart_delay = 1.5  # seconds

    def on_modified(self, event):
        if self._should_restart(event):
            self._debounced_restart()

    def on_created(self, event):
        if self._should_restart(event):
            self._debounced_restart()

    def on_deleted(self, event):
        pass  # Don't restart on deletions

    def _should_restart(self, event) -> bool:
        path = Path(event.src_path)
        if path.name in IGNORE_FILES:
            return False
        for part in path.parts:
            if part in IGNORE_DIRS or part.startswith("."):
                return False
        if path.suffix in {".pyc", ".pyo"}:
            return False
        return path.suffix == ".py"

    def _debounced_restart(self):
        now = time.time()
        if now - self.last_restart < self.restart_delay:
            return
        self.last_restart = now
        self.on_restart()


def start_uvicorn():
    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app",
         "--host", "0.0.0.0", "--port", UVICORN_PORT],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        preexec_fn=os.setsid
    )
    return proc


def main():
    print(f"[watcher] Starting backend watcher on port {UVICORN_PORT}...")
    print(f"[watcher] Watching: {BACKEND_DIR}")

    proc = start_uvicorn()
    print(f"[watcher] Backend started (PID={proc.pid})")

    def restart():
        print(f"\n[watcher] Change detected → restarting backend...")
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        proc.wait()
        time.sleep(0.5)
        proc = start_uvicorn()
        print(f"[watcher] Backend restarted (PID={proc.pid})")

    observer = Observer()
    handler = RestartHandler(restart)
    observer.schedule(handler, str(BACKEND_DIR), recursive=True)
    observer.start()

    try:
        while True:
            line = proc.stdout.readline()
            if line:
                sys.stdout.write(line.decode(errors="replace"))
                sys.stdout.flush()
            elif proc.poll() is not None:
                print("[watcher] Backend process died unexpectedly. Restarting...")
                proc = start_uvicorn()
    except KeyboardInterrupt:
        print("\n[watcher] Stopping...")
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
