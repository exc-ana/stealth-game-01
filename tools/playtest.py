"""Play Lanternlight for real in headless Chromium and assert the game
works: movement, relic pickup, detection, being caught, and the exit.
"""
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
failures = []


def check(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL'} {name}{' — ' + detail if detail else ''}")
    if not ok:
        failures.append(name)


STATE_JS = """() => {
  const g = window.__lanternlight;
  return {
    status: g.status,
    px: +g.player.x.toFixed(2),
    py: +g.player.y.toFixed(2),
    relicsLeft: g.world.relicsLeft,
    coins: g.player.coins,
    suspicion: Math.round(Math.max(0, ...g.guards.map(x => x.suspicion))),
    guardState: g.guards[0].state,
    level: g.levelIndex,
  };
}"""

server = subprocess.Popen(
    ["node", "serve.ts", "--port", "8081"], cwd=ROOT,
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)
time.sleep(1.2)
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto("http://localhost:8081/", wait_until="load")
        page.wait_for_timeout(600)

        s = page.evaluate(STATE_JS)
        check("title screen shows first", s["status"] == "title", s["status"])

        page.keyboard.press("Enter")
        page.wait_for_timeout(200)
        s = page.evaluate(STATE_JS)
        check("Enter starts the game", s["status"] == "playing", s["status"])
        start_x = s["px"]
        page.keyboard.down("KeyD")
        page.wait_for_timeout(900)
        page.keyboard.up("KeyD")
        s = page.evaluate(STATE_JS)
        check("D moves the thief right", s["px"] > start_x + 1, f"x {start_x} -> {s['px']}")

        page.keyboard.down("KeyW")
        page.wait_for_timeout(1200)
        page.keyboard.up("KeyW")
        s = page.evaluate(STATE_JS)
        check("north wall blocks movement", 0.5 < s["py"] < 2.5, f"y={s['py']}")

        page.evaluate("""() => {
          const g = window.__lanternlight;
          const relic = g.world.relics[0];
          g.player.x = relic.x + 0.5;
          g.player.y = relic.y + 0.5;
        }""")
        page.wait_for_timeout(300)
        s = page.evaluate(STATE_JS)
        check("relic is pocketed on touch", s["relicsLeft"] == 1, f"left={s['relicsLeft']}")

        page.evaluate("""() => {
          const g = window.__lanternlight;
          const guard = g.guards[0];
          g.player.x = guard.x + Math.cos(guard.angle) * 3;
          g.player.y = guard.y + Math.sin(guard.angle) * 3;
        }""")
        page.wait_for_timeout(1500)
        s = page.evaluate(STATE_JS)
        check("guard suspicion climbs in its cone", s["suspicion"] > 30, f"suspicion={s['suspicion']}")
        check("guard turns suspicious or alert", s["guardState"] in ("suspicious", "alert"), s["guardState"])

        page.wait_for_timeout(6000)
        s = page.evaluate(STATE_JS)
        check("guard catches the thief", s["status"] == "caught",
              f"status={s['status']} suspicion={s['suspicion']}")

        page.keyboard.press("KeyR")
        page.wait_for_timeout(200)
        s = page.evaluate(STATE_JS)
        check("R restarts the level", s["status"] == "playing", s["status"])
        page.evaluate("""() => {
          const g = window.__lanternlight;
          for (const relic of g.world.relics) g.world.takeRelic(relic);
          g.player.x = g.world.exit.x + 0.5;
          g.player.y = g.world.exit.y + 0.5;
        }""")
        page.wait_for_timeout(300)
        s = page.evaluate(STATE_JS)
        check("exit with all relics completes the level", s["status"] == "level-complete",
              f"status={s['status']}")
        page.keyboard.press("Enter")
        page.wait_for_timeout(200)
        s = page.evaluate(STATE_JS)
        check("Enter advances to level 2", s["status"] == "playing" and s["level"] == 1,
              f"level={s['level']} status={s['status']}")

        check("no page errors", len(errors) == 0, "; ".join(errors))
        browser.close()
finally:
    server.terminate()
if failures:
    print(f"\nPLAYTEST FAILED: {', '.join(failures)}")
    sys.exit(1)
print("\nPLAYTEST PASSED")
