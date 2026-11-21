// Lanternlight — the level as the game sees it: tiles, collision,
// line of sight, and the flood-fill that proves every level is winnable.

import { TILE } from './config.js';

export const SOLID = new Set(['#', 'c']);
export const SEES_THROUGH = new Set(['.', 'd', 'P', 'R', 'E', 'G']);

export class World {
  constructor(level) {
    this.level = level;
    this.width = level.width;
    this.height = level.height;
    this.tiles = level.rows.map((row) => row.split(''));
    this.relics = level.relics.map((r) => ({ ...r }));
    this.exit = { ...level.exit };
    this.playerStart = { ...level.player };
  }

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return '#';
    return this.tiles[ty][tx];
  }

  isSolid(tx, ty) {
    return SOLID.has(this.tileAt(tx, ty));
  }

  blocksSight(tx, ty) {
    return !SEES_THROUGH.has(this.tileAt(tx, ty));
  }

  isShadow(tx, ty) {
    return this.tileAt(tx, ty) === 'd';
  }

  // Circle (in tile units) against solid tiles.
  collides(px, py, radius) {
    const x0 = Math.floor(px - radius);
    const x1 = Math.floor(px + radius);
    const y0 = Math.floor(py - radius);
    const y1 = Math.floor(py + radius);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.isSolid(tx, ty)) continue;
        const cx = Math.max(tx, Math.min(px, tx + 1));
        const cy = Math.max(ty, Math.min(py, ty + 1));
        const dx = px - cx;
        const dy = py - cy;
        if (dx * dx + dy * dy < radius * radius) return true;
      }
    }
    return false;
  }

  // Slide along walls: try the full step, then each axis alone.
  moveCircle(px, py, dx, dy, radius) {
    if (!this.collides(px + dx, py + dy, radius)) return [px + dx, py + dy];
    if (!this.collides(px + dx, py, radius)) return [px + dx, py];
    if (!this.collides(px, py + dy, radius)) return [px, py + dy];
    return [px, py];
  }

  // True when no sight-blocking tile stands between two tile points.
  hasLineOfSight(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist * 4));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.blocksSight(Math.floor(ax + dx * t), Math.floor(ay + dy * t))) return false;
    }
    return true;
  }

  // Cast one vision ray: how far (in tiles) before a wall or crate.
  castRay(ax, ay, angle, maxDist) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let dist = 0.2;
    while (dist < maxDist) {
      if (this.blocksSight(Math.floor(ax + dx * dist), Math.floor(ay + dy * dist))) break;
      dist += 0.15;
    }
    return Math.min(dist, maxDist);
  }

  relicAt(tx, ty) {
    return this.relics.find((r) => !r.taken && r.x === tx && r.y === ty) ?? null;
  }

  takeRelic(relic) {
    relic.taken = true;
  }

  get relicsLeft() {
    return this.relics.filter((r) => !r.taken).length;
  }

  get allRelicsTaken() {
    return this.relicsLeft === 0;
  }

  atExit(px, py) {
    return Math.floor(px) === this.exit.x && Math.floor(py) === this.exit.y;
  }

  // Flood-fill from the player start: every relic, the exit, every guard
  // spawn and every patrol waypoint must be reachable, or the level is
  // broken. Returns a list of problems (empty when the level is sound).
  validate() {
    const problems = [];
    const seen = new Set();
    const queue = [[this.playerStart.x, this.playerStart.y]];
    seen.add(`${this.playerStart.x},${this.playerStart.y}`);
    while (queue.length) {
      const [x, y] = queue.pop();
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const key = `${nx},${ny}`;
        if (seen.has(key) || this.isSolid(nx, ny)) continue;
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
    const mustReach = [
      ...this.relics.map((r) => [`relic`, r.x, r.y]),
      [`exit`, this.exit.x, this.exit.y],
      ...this.level.guards.flatMap((g, i) => [
        [`guard ${i} spawn`, g.x, g.y],
        ...g.waypoints.map((w, j) => [`guard ${i} waypoint ${j}`, w[0], w[1]]),
      ]),
    ];
    for (const [label, x, y] of mustReach) {
      if (!seen.has(`${x},${y}`)) problems.push(`${label} at (${x},${y}) is unreachable`);
      if (this.isSolid(x, y)) problems.push(`${label} at (${x},${y}) sits on a solid tile`);
    }
    return problems;
  }

  toPixelsX(tx) {
    return tx * TILE;
  }

  toPixelsY(ty) {
    return ty * TILE;
  }
}
