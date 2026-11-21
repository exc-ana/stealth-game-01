// Lanternlight — shared tuning and palette.
// A top-down stealth game: slip through a moonlit gallery, pocket the
// relics and reach the exit without a guard's lantern ever catching you.

export const TILE = 32;
export const VIEW_W = 960;
export const VIEW_H = 640;

export const COLORS = {
  floor: '#232733',
  floorAlt: '#262b38',
  floorDark: '#1a1d27',
  wall: '#4a4f63',
  wallTop: '#5d6380',
  crate: '#7a5a34',
  crateTop: '#96703f',
  shadow: '#12141d',
  shadowEdge: '#2c3350',
  exit: '#37d67a',
  exitGlow: '#7dffb0',
  relic: '#ffd75e',
  player: '#e8ecf5',
  playerCloak: '#3b6ea5',
  guard: '#e05a4e',
  guardLantern: '#ffb347',
  coneCalm: 'rgba(255, 179, 71, 0.20)',
  coneSuspicious: 'rgba(255, 196, 66, 0.34)',
  coneAlert: 'rgba(224, 90, 78, 0.42)',
  hudBg: 'rgba(10, 12, 20, 0.82)',
  hudText: '#e8ecf5',
  hudMuted: '#9aa3b8',
  danger: '#ff5a4e',
  gold: '#ffd75e',
};

export const TUNING = {
  // Movement, tiles per second.
  walkSpeed: 4.6,
  sneakSpeed: 2.6,
  runSpeed: 6.4,
  // Guard vision.
  viewRange: 7.2, // tiles
  viewHalfAngle: 0.61, // radians (~35 degrees each side)
  // Suspicion 0..100. Rates per second while the player is seen.
  detectBase: 55,
  detectCloseBonus: 55, // extra at point-blank range
  detectDecay: 26,
  sneakFactor: 0.55,
  shadowFactor: 0.45,
  runFactor: 1.5,
  suspiciousAt: 35,
  spottedAt: 100,
  // Guard movement, tiles per second.
  patrolSpeed: 1.7,
  investigateSpeed: 2.6,
  chaseSpeed: 3.6,
  catchDistance: 0.55, // tiles
  // Noise: running is heard this far (tiles); a thrown coin this far.
  runNoiseRadius: 5.5,
  coinNoiseRadius: 7,
  coinsPerLevel: 3,
  // How long a guard searches the last seen spot before giving up.
  searchSeconds: 3.5,
  // Suspicion drains fully this long after the player breaks sight.
  calmAfterSeconds: 2.0,
};

export const LEVELS = ['The Velvet Gallery', 'The Sunken Vault', 'The Starlight Roof'];
