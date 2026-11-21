// Lanternlight — the thief: WASD to slip, Shift to sneak, run to risk it.
// Running is fast and loud; sneaking is slow and hard to spot. A thrown
// coin (mouse click) rings out and pulls a guard over to look.

import { TUNING } from './config.js';

export class Player {
  constructor(start) {
    this.x = start.x + 0.5;
    this.y = start.y + 0.5;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.coins = TUNING.coinsPerLevel;
    this.stepPhase = 0;
    this.noisePulse = 0;
  }

  get speed() {
    if (this.sneaking) return TUNING.sneakSpeed;
    if (this.running) return TUNING.runSpeed;
    return TUNING.walkSpeed;
  }

  update(dt, world, input) {
    let mx = 0;
    let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    this.moving = mx !== 0 || my !== 0;
    this.sneaking = Boolean(input.sneak && this.moving);
    this.running = Boolean(input.run && this.moving && !this.sneaking);
    if (this.moving) {
      const len = Math.hypot(mx, my);
      const step = this.speed * dt;
      const [nx, ny] = world.moveCircle(
        this.x,
        this.y,
        (mx / len) * step,
        (my / len) * step,
        0.28,
      );
      this.x = nx;
      this.y = ny;
      this.angle = Math.atan2(my, mx);
      this.stepPhase += step * (this.sneaking ? 1.4 : 2.2);
      if (this.running) this.noisePulse = Math.max(this.noisePulse, TUNING.runNoiseRadius);
    }
    if (this.noisePulse > 0) this.noisePulse = Math.max(0, this.noisePulse - dt * 14);
  }

  // A thrown coin lands on a tile and rings: every guard in earshot
  // walks over to see what made the sound.
  throwCoin(tileX, tileY, guards) {
    if (this.coins <= 0) return false;
    this.coins -= 1;
    for (const guard of guards) {
      const dist = Math.hypot(guard.x - (tileX + 0.5), guard.y - (tileY + 0.5));
      if (dist <= TUNING.coinNoiseRadius) guard.hearNoise(tileX + 0.5, tileY + 0.5);
    }
    return true;
  }

  // Running feet carry: guards in earshot come to look.
  broadcastRunNoise(guards) {
    if (!this.running) return;
    for (const guard of guards) {
      const dist = Math.hypot(guard.x - this.x, guard.y - this.y);
      if (dist <= TUNING.runNoiseRadius) guard.hearNoise(this.x, this.y);
    }
  }
}
