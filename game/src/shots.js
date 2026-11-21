// Lanternlight — staged scenes for the screenshots.
// ?shot=title | play | alert | win, with ?seed= for the dust.
// Each scene is built from the same deterministic level data, so the
// same URL always renders the same picture.

import { GUARD_STATE } from './guard.js';

// Place the thief and the guards for a scene, then let the world settle.
export function stageShot(game, shot) {
  const { world, player, guards } = game;
  if (shot === 'title') {
    game.status = 'title';
    return;
  }
  if (shot === 'play') {
    // Mid-heist: one relic already pocketed, the thief crouched in shadow
    // at the edge of a patrol lantern's cone.
    game.status = 'playing';
    world.relics[0].taken = true;
    const shadow = findShadowTile(world);
    player.x = shadow.x + 0.5;
    player.y = shadow.y + 0.5;
    player.sneaking = true;
    const guard = guards[0];
    guard.suspicion = 22;
    aimGuardAt(guard, player);
    return;
  }
  if (shot === 'alert') {
    // Caught in the open: the nearest guard is chasing, suspicion full.
    game.status = 'playing';
    const guard = guards[0];
    player.x = guard.x + 2.2;
    player.y = guard.y + 0.6;
    guard.state = GUARD_STATE.ALERT;
    guard.suspicion = 100;
    guard.lastSeen = { x: player.x, y: player.y };
    aimGuardAt(guard, player);
    game.spottedCount = 1;
    return;
  }
  if (shot === 'win') {
    // The getaway: every relic pocketed, the thief one step from the exit.
    game.status = 'playing';
    for (const relic of world.relics) relic.taken = true;
    player.x = world.exit.x - 1.5;
    player.y = world.exit.y + 0.5;
    game.time = 97;
    return;
  }
  game.status = 'title';
}

function findShadowTile(world) {
  for (let y = 1; y < world.height - 1; y++) {
    for (let x = 1; x < world.width - 1; x++) {
      if (world.tileAt(x, y) === 'd') return { x, y };
    }
  }
  return { x: world.playerStart.x, y: world.playerStart.y };
}

function aimGuardAt(guard, player) {
  guard.angle = Math.atan2(player.y - guard.y, player.x - guard.x);
}

export function shotList() {
  return ['title', 'play', 'alert', 'win'];
}

export function describeShot(shot) {
  return {
    title: 'Title screen',
    play: 'Mid-heist, sneaking past a patrol',
    alert: 'Spotted — a guard gives chase',
    win: 'All relics pocketed, reaching the exit',
  }[shot];
}
