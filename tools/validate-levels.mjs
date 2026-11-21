// Validate every Lanternlight level: row widths, flood-fill reachability
// of every relic, exit, guard spawn and patrol waypoint.
import { LEVELS } from '../game/src/levels.js';
import { World } from '../game/src/world.js';

let failed = false;
for (const level of LEVELS) {
  const widths = new Set(level.rows.map((r) => r.length));
  console.log(`\n${level.name}: ${level.width}x${level.height}, guards=${level.guards.length}, relics=${level.relics.length}`);
  if (widths.size !== 1 || !widths.has(level.width)) {
    console.log(`  FAIL row widths: ${[...widths].join(',')}`);
    failed = true;
  }
  const world = new World(level);
  const problems = world.validate();
  // A guard walks straight lines between waypoints: every segment must
  // be clear of solid tiles, or the guard stalls against a wall.
  for (let gi = 0; gi < level.guards.length; gi++) {
    const guard = level.guards[gi];
    const points = [[guard.x, guard.y], ...guard.waypoints];
    // Spawn walks to the first waypoint, then the loop closes from the
    // last waypoint back to the first — never back to the spawn.
    const segments = [];
    for (let s = 0; s < points.length - 1; s++) segments.push([points[s], points[s + 1]]);
    segments.push([guard.waypoints[guard.waypoints.length - 1], guard.waypoints[0]]);
    for (const [[ax, ay], [bx, by]] of segments) {
      const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 4;
      if (steps === 0) continue;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const tx = Math.floor(ax + (bx - ax) * t);
        const ty = Math.floor(ay + (by - ay) * t);
        if (world.isSolid(tx, ty)) {
          problems.push(`guard ${gi} patrol segment (${ax},${ay})->(${bx},${by}) hits solid tile (${tx},${ty})`);
          break;
        }
      }
    }
  }
  if (problems.length) {
    for (const p of problems) console.log(`  FAIL ${p}`);
    failed = true;
  } else {
    console.log('  OK reachable: all relics, exit, guard spawns and waypoints');
  }
  // Print the map for a visual check.
  for (const row of level.rows) console.log(`  ${row}`);
}
if (failed) {
  console.log('\nVALIDATION FAILED');
  process.exit(1);
}
console.log('\nALL LEVELS VALID');
