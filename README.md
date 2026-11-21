[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/exc-ana/stealth-game-01/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/exc-ana/stealth-game-01/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

# Lanternlight — make.fun stealth game entry

Original top-down 2D canvas stealth game (Node 22, stdlib only, no libraries, no network, no assets). You are a thief in three moonlit galleries; pocket every relic, reach the green EXIT unseen.

- **Levels (3):** The Velvet Gallery (2 guards, 2 relics) · The Sunken Vault (3 guards, 3 relics) · The Starlight Roof (4 guards, 3 relics).
- **Guards:** waypoint patrols, ray-cast vision cones, suspicion 0–100 (investigate → chase → search → return).
- **Cover:** crates block sight; dark shadow tiles hide you; running is loud; throw coins to distract.
- **Verification:** deterministic (two runs byte-identical, dossier.json SHA a5a7df1f…); all 3 levels valid (flood-fill reachable); 12/12 headless playtest passes; 4 real screenshots (1280×800).

Entry: `main.ts` at the repo root. Run with `MAKEFUN_OUTPUT_DIR=<output> node main.ts`. See `WORKING-NOTES.md` for rules, design, and verification.
