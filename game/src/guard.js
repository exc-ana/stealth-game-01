// Lanternlight — guard patrol, suspicion and chase.
// A guard walks its waypoint loop, lantern swinging. When it sees the
// thief its suspicion climbs; suspicious, it walks over to look; spotted,
// it gives chase. Lose it in the dark and it searches, then goes home.

import { TUNING } from './config.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  ALERT: 'alert',
  SEARCH: 'search',
  RETURN: 'return',
};

export class Guard {
  constructor(def) {
    this.x = def.x + 0.5;
    this.y = def.y + 0.5;
    this.waypoints = def.waypoints.map(([x, y]) => [x + 0.5, y + 0.5]);
    this.waypointIndex = 0;
    this.pause = def.pause ?? 1.2;
    this.pauseLeft = 0;
    // Face along the patrol to start.
    const [nx, ny] = this.waypoints[0];
    this.angle = Math.atan2(ny - this.y, nx - this.x);
    this.state = GUARD_STATE.PATROL;
    this.suspicion = 0;
    this.lastSeen = null;
    this.searchLeft = 0;
    this.calmLeft = 0;
    this.noiseTarget = null;
    this.caughtPlayer = false;
  }

  get speed() {
    switch (this.state) {
      case GUARD_STATE.ALERT:
        return TUNING.chaseSpeed;
      case GUARD_STATE.SUSPICIOUS:
      case GUARD_STATE.SEARCH:
      case GUARD_STATE.RETURN:
        return TUNING.investigateSpeed;
      default:
        return TUNING.patrolSpeed;
    }
  }

  // Can this guard see the player right now? Distance, cone and a clear
  // line of sight all have to agree.
  canSee(world, px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > TUNING.viewRange) return 0;
    let diff = Math.atan2(dy, dx) - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > TUNING.viewHalfAngle) return 0;
    if (!world.hasLineOfSight(this.x, this.y, px, py)) return 0;
    // Closer is easier to spot: 1.0 up close, ~0.45 at the cone's edge.
    return 1 - 0.55 * (dist / TUNING.viewRange);
  }

  // Step the guard one frame. Returns events for sound and the HUD.
  update(dt, world, player) {
    const events = [];
    const seen = this.canSee(world, player.x, player.y);
    const wasState = this.state;

    if (seen > 0) {
      let rate = TUNING.detectBase + TUNING.detectCloseBonus * seen;
      if (player.sneaking) rate *= TUNING.sneakFactor;
      if (world.isShadow(Math.floor(player.x), Math.floor(player.y))) rate *= TUNING.shadowFactor;
      if (player.running) rate *= TUNING.runFactor;
      this.suspicion = Math.min(100, this.suspicion + rate * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.calmLeft = TUNING.calmAfterSeconds;
      if (this.suspicion >= TUNING.spottedAt && this.state !== GUARD_STATE.ALERT) {
        this.state = GUARD_STATE.ALERT;
        events.push({ type: 'spotted', guard: this });
      } else if (this.suspicion >= TUNING.suspiciousAt && this.state === GUARD_STATE.PATROL) {
        this.state = GUARD_STATE.SUSPICIOUS;
        events.push({ type: 'suspicious', guard: this });
      }
    } else {
      this.calmLeft -= dt;
      if (this.calmLeft <= 0) {
        this.suspicion = Math.max(0, this.suspicion - TUNING.detectDecay * dt);
      }
      if (this.state === GUARD_STATE.ALERT && this.suspicion < TUNING.suspiciousAt) {
        this.state = GUARD_STATE.SEARCH;
        this.searchLeft = TUNING.searchSeconds;
        events.push({ type: 'lost', guard: this });
      }
    }

    if (this.noiseTarget && this.state === GUARD_STATE.PATROL) {
      this.state = GUARD_STATE.SUSPICIOUS;
      this.lastSeen = { ...this.noiseTarget };
      this.noiseTarget = null;
    }

    const target = this.pickTarget();
    if (target) {
      const arrived = this.walkToward(world, target, dt);
      if (arrived) this.onArrive(events);
    } else if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
    }

    // Caught: the guard is on top of the thief.
    if (Math.hypot(player.x - this.x, player.y - this.y) < TUNING.catchDistance) {
      this.caughtPlayer = true;
    }
    if (wasState !== this.state) events.push({ type: 'state', guard: this, state: this.state });
    return events;
  }

  pickTarget() {
    switch (this.state) {
      case GUARD_STATE.PATROL:
        return this.waypoints[this.waypointIndex];
      case GUARD_STATE.SUSPICIOUS:
      case GUARD_STATE.ALERT:
        return this.lastSeen ? [this.lastSeen.x, this.lastSeen.y] : null;
      case GUARD_STATE.SEARCH:
        return this.lastSeen ? [this.lastSeen.x, this.lastSeen.y] : null;
      case GUARD_STATE.RETURN:
        return this.waypoints[this.waypointIndex];
      default:
        return null;
    }
  }

  walkToward(world, [tx, ty], dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.08) return true;
    const step = Math.min(dist, this.speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    const [mx, my] = world.moveCircle(this.x, this.y, nx - this.x, ny - this.y, 0.3);
    this.x = mx;
    this.y = my;
    this.angle = Math.atan2(dy, dx);
    return dist - step < 0.08;
  }

  onArrive(events) {
    if (this.state === GUARD_STATE.PATROL) {
      this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
      this.pauseLeft = this.pause;
      return;
    }
    if (this.state === GUARD_STATE.SUSPICIOUS) {
      this.state = GUARD_STATE.SEARCH;
      this.searchLeft = TUNING.searchSeconds;
      events.push({ type: 'search', guard: this });
      return;
    }
    if (this.state === GUARD_STATE.SEARCH) {
      this.searchLeft -= 0.1;
      if (this.searchLeft <= 0) {
        this.state = GUARD_STATE.RETURN;
        events.push({ type: 'return', guard: this });
      }
      return;
    }
    if (this.state === GUARD_STATE.RETURN) {
      this.state = GUARD_STATE.PATROL;
      this.suspicion = 0;
    }
  }

  hearNoise(x, y) {
    if (this.state === GUARD_STATE.ALERT) return;
    this.noiseTarget = { x, y };
  }

  get alertLevel() {
    if (this.state === GUARD_STATE.ALERT) return 2;
    if (this.state === GUARD_STATE.SUSPICIOUS || this.state === GUARD_STATE.SEARCH) return 1;
    return 0;
  }
}
