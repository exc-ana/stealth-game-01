"""Take Lanternlight's screenshots with headless Chromium (Playwright):
one real render of the game's own code per entry of shots.json.
Viewport 1280x800: long side 1280, short side 800, inside the kit's
caps (long side at most 1280, short side at least 480, 256 KiB each).
"""
import json
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = json.loads((ROOT / "shots.json").read_text())

server = subprocess.Popen(
    ["node", "serve.ts", "--port", "8080"], cwd=ROOT,
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)
time.sleep(1.2)
failed = False
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        errors = []
        page.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        for shot in SHOTS:
            page.goto(f"http://localhost:8080/{shot['query']}", wait_until="load")
            page.wait_for_timeout(1500)
            path = ROOT / "screenshots" / shot["name"]
            page.screenshot(path=path, type="jpeg", quality=82)
            size = path.stat().st_size
            print(f"{shot['name']}: {size} bytes{'  OVER 256 KiB!' if size > 262144 else ''}")
            if size > 262144:
                failed = True
        browser.close()
        if errors:
            print("PAGE ERRORS:")
            for e in errors:
                print(f"  {e}")
            failed = True
        else:
            print("no page errors")
finally:
    server.terminate()
if failed:
    sys.exit(1)
print("SHOTS DONE")
