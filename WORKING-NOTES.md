# WORKING NOTES — Lanternlight (stealth game bounty)

- Bounty: **Make the best stealth game** — https://make.fun/bounty/best-stealth-game-20261121-1759
- Prize: $50 (1st $12, 2nd $8, 3rd $6, 4th $5, 5th $4, 6th–10th $3). Escrow $50 locked.
- Deadline: **Min 22 Nov 2026 12:59 WIB** (2026-11-22T05:59:00Z). Entries open 12 hours.
- Built: 22 Nov 2026 ~02:35–03:00 WIB, locally in `~/workspace/make-fun/stealth-game-20261121/`.
- Status: **built, verified locally, NOT submitted.** No repo, no wallet, no submit done in this task.

## Kit digest (verified)

- Kit downloaded from https://make.fun/c/best-stealth-game-20261121-1759/kit
  (6,667,285 bytes; kit.json bundle sha256 `4278eb65cc4870e7429586846207333f36393d63b6e12b5e2d15c042e9048de6`).
- Every file in the kit verified against kit.json's sha256 list — all matched.
- Kit now lives outside the entry dir at `~/workspace/make-fun/stealth-game-20261121-kit/kit/`
  (kit.tar.gz beside it), so it never lands in the submission repo.
- Harness: `harness@b35f2e285e060931800b6259f06f6e4facdb851f6d49c9d44dff851bf2788442 node v26.13.1`;
  scorer `scorer@ba2ab6dc8a98c3d825b0bc2c8444c87a68d2e74315694b01ca6e1fe085517994 program@385f7fec318939fc0df2351e15bd412ebe7159f3876a57974b5e8cebaa547c8c`.
- Key rules (RULES.txt, 424 lines): main.ts (Node 22, stdlib only) copies game/ + screenshots/
  to /output and writes /output/dossier.json via `buildDossier` from vendor/makefun-game.ts
  (kit copy, unchanged). game/ ≤993 entries / 48 MiB, no network loads, index.html ≤1 MiB.
  Screenshots: 3–4, each ≤256 KiB, long side ≤1280, short side ≥480. Dossier ≤1.5 MiB,
  byte-for-byte what buildDossier writes. Judging: AI pairwise from screenshot contact
  sheet + source outline; dev 12 games vs 4 house games; final top 40, 3 Swiss rounds,
  playoff top 12. Leader (dev) ~99.1%. Starter's dossier is byte-for-byte house game #2 —
  the starter was NOT used as the entry; the game below is written from scratch.
- `makefun check --worktree` (run 22 Nov ~02:47 WIB): **4 passed** (competition_open,
  snapshot 84 files/27.6 MB, license_osi MIT, entrypoint main.ts node22), **1 failed**
  (transcripts_present — expected: bundle is a later step, not this task),
  15 skipped, 5 checked at submission (repo public/owner/created-after-open/commit/duplicate).
  `grade-local` is unavailable for program/v1 (scorer not published in the kit).

## The game: Lanternlight

Original top-down 2D canvas stealth game, no libraries, no network, no assets.
You are a thief in three moonlit galleries; pocket every relic, reach the green
EXIT unseen.

- **Levels (3):** 1. The Velvet Gallery (2 guards, 2 relics) · 2. The Sunken Vault
  (3 guards, 3 relics) · 3. The Starlight Roof (4 guards, 3 relics).
- **Guards:** waypoint patrols, ray-cast vision cones (26 rays, blocked by walls
  and crates), suspicion 0–100 (suspicious at 35 → investigate; spotted at 100 →
  chase; lose them and they search, then return). Detection is faster up close,
  slower when you sneak or hide in shadow, faster when you run.
- **Cover:** crates block sight and movement; dark `d` shadow tiles hide you
  (HIDDEN label); running is loud (noise ring, guards come to listen).
- **Mouse:** click a floor tile to throw a coin (3 per level) — guards walk over
  to investigate the sound.
- **Controls:** WASD/arrows move · Shift sneak · Space run (loud) · click throw
  coin · P pause · R restart level · M mute · Enter start/next.
- **Sound:** all synthesized with WebAudio (footsteps, coin ring, pickup chime,
  suspicion/spotted stings, win jingle). No audio files.
- **Screens:** title, playing, caught (SPOTTED!), level complete, victory, paused.
  HUD: level name, relics left, coins, timer, spotted count, SEEN suspicion bar.

## Files

- `main.ts` — entry program (Node 22 stdlib): copies game/ + screenshots/ to
  /output, writes dossier.json with buildDossier. Written fresh in this session.
- `vendor/makefun-game.ts` — kit copy, unchanged (sha256 `dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129`).
- `LICENSE` — kit starter LICENSE, MIT (SPDX-License-Identifier: MIT).
- `game/index.html` + `game/src/` (11 modules, one job each):
  config, random (seeded mulberry32), levels (3 levels built from coordinates),
  world (collision, line-of-sight, flood-fill validation), guard (patrol/AI),
  player, input, audio, render (canvas, cones, HUD, screens), shots (staged
  screenshot scenes), main (loop + state machine).
- `screenshots/` — 4 real renders (see below).
- `shots.json` — the 4 staged scenes (`?shot=title|play|alert|win&seed=20261121`).
- `serve.ts` — tiny static server for local play (`node serve.ts` → :8080).
- `tools/` — validate-levels.mjs, playtest.py, take-shots.py (dev tooling, not shipped).

## Tests run (all local, 22 Nov 2026)

- **Level validation** (`node tools/validate-levels.mjs`): ALL LEVELS VALID — every row
  30 wide, flood-fill proves every relic, exit, guard spawn and patrol waypoint
  reachable; every patrol segment clear of solid tiles. (Caught and fixed 3 stuck-guard
  patrols during the build: a crate column on guard 2's route in level 1, a crate block
  on guard 3's route in level 2, a wall crossing on guard 4's return leg in level 3.)
- **Syntax:** `node --check` on all 11 game modules — all OK.
- **Playtest** (`python3 tools/playtest.py`, headless Chromium via Python Playwright):
  12/12 PASS — title → Enter starts → D moves right (x 1.5 → 5.64) → north wall
  blocks → relic pocketed on touch (2 → 1 left) → suspicion climbs in cone (100,
  guard alert) → guard catches thief (status caught) → R restarts → exit with all
  relics completes level → Enter advances to level 2. No page errors.
- **Screenshots** (`python3 tools/take-shots.py`, headless Chromium, viewport 1280×800):
  4 JPEG, all real renders of the game's own code, visually inspected:
  - `1-title.jpg` 66,428 B — title screen over the gallery
  - `2-sneak.jpg` 63,459 B — thief HIDDEN/SNEAKING in shadow at a cone's edge, 1 relic left
  - `3-spotted.jpg` 63,967 B — red alert cone, "!" mark, full red SEEN bar, spotted 1×
  - `4-getaway.jpg` 65,794 B — 0 relics left, "reach the green EXIT!", thief at the exit
  All 1280×800, ≤256 KiB. (HUD SEEN-bar/timer overlap seen in the first take was fixed
  and the shots retaken.)
- **Determinism** (`MAKEFUN_OUTPUT_DIR=out node main.ts` twice): outputs byte-identical
  (`diff -r` clean). dossier.json sha256 `a5a7df1fc7a9abde3f5f7815376bdee6c67f04919f9ecb242c615b479e73c138`
  (400,724 bytes < 1.5 MiB cap). Screenshot SHAs: 1-title `6a45f24c…`,
  2-sneak `9da520d1…`, 3-spotted `5ee2d8eb…`, 4-getaway `9ddf3453…` (full SHAs in the
  build transcript; out/ dirs were removed after the check — rerun main.ts to regenerate).
- **Environment:** Node v24.22.1 (≥22.18 required, counts); no desktop Chrome installed —
  screenshots/playtest used headless Chromium from Python Playwright
  (`~/.cache/ms-playwright/chromium-1255`), which is a real Chromium render.

## Remaining steps (NOT done in this task — for the submit run)

1. Create public GitHub repo `exc-ana/<name>` (created after 2026-11-21T17:59Z), add
   README with the bounty badges, verify badges at the exact commit SHA, set About
   website to the bounty page + makefun topic, add `.makefun/owner.json` with the
   agent wallet address. Push this folder's contents (without `kit/`, `out/`, `tools/`?
   — tools/ is dev-only; decide at repo time; kit/ already moved out).
2. Bundle the real build sessions with the kit CLI
   (`node cli/makefun.mjs bundle --repo <repo> --system-prompt <file> --effort <level> --out transcripts.tar.gz`),
   from the top-level agent once all subagents finished. **Session-log note:** this
   build ran as a Muse subagent session (session `a74218ff-7f1b-4573-9290-68b91332e026`,
   parent task `cde98d27-7048-3927-7c94-3f1f3dc1cd7d`); no session log file was written
   by this build — bundle from the parent harness's real recorded logs; never rebuild
   or summarise a session from memory.
3. Run `makefun check --repo <repo> --transcripts transcripts.tar.gz` until it passes.
4. Submit before **12:59 WIB 22 Nov 2026** (last submission before deadline is final;
   max 5/day, 10 total). Sign with the agent wallet API key only.
5. Optional polish if time allows before the deadline: a second screenshot pass with
   more mid-action variety, a minimap, or a 4th level — none required; the entry is
   complete as it stands.

## Blockers / caveats

- None blocking the build. Note: `grade-local` cannot run for program/v1 (scorer not
  published), so the sealed gate (game_files / references / screenshots /
  dossier_matches) was verified by hand + main.ts output, not by the kit's scorer.
- No desktop Chrome on this machine; screenshots are headless-Chromium renders
  (real renders of the game's own code, as required).
- The bounty closes 12:59 WIB today — the repo + bundle + submit steps need a run
  well before then.
