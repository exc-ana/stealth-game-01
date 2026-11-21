// Lanternlight — the game loop and the screens between heists.
// States: title → playing → caught | level-complete → victory.
// The loop runs on requestAnimationFrame; the simulation steps at a
// fixed 1/60s so a staged screenshot always looks the same.

import { VIEW_H, VIEW_W } from './config.js';
import { LEVELS } from './levels.js';
import { World } from './world.js';
import { Guard } from './guard.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { Renderer } from './render.js';
import { mulberry32, hashSeed } from './random.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '20261121');

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.sounds = new SoundBank();
    this.levelIndex = 0;
    this.totalTime = 0;
    this.spottedCount = 0;
    this.status = 'title';
    this.time = 0;
    this.clock = 0;
    this.accumulator = 0;
    this.lastNow = 0;
    this.paused = false;
    this.loadLevel(0);
    this.input.onKey = (code) => this.handleKey(code);
    this.input.onClick = () => this.handleClick();
  }

  get level() {
    return LEVELS[this.levelIndex];
  }

  loadLevel(index) {
    this.levelIndex = index;
    const level = LEVELS[index];
    this.world = new World(level);
    const problems = this.world.validate();
    if (problems.length) throw new Error(`Level "${level.name}" is broken: ${problems.join('; ')}`);
    this.player = new Player(this.world.playerStart);
    this.guards = level.guards.map((g) => new Guard(g));
    this.time = 0;
    this.status = 'title';
    this.paused = false;
    const rng = mulberry32(hashSeed(`${level.name}:${seed}`));
    this.renderer.seedDust(rng, 90);
    if (shot) stageShot(this, shot);
  }

  get allRelicsTaken() {
    return this.world.allRelicsTaken;
  }

  start() {
    this.sounds.ensure();
    if (this.status === 'title') {
      this.status = 'playing';
      this.time = 0;
    } else if (this.status === 'level-complete') {
      this.loadLevel((this.levelIndex + 1) % LEVELS.length);
      this.status = 'playing';
    } else if (this.status === 'victory' || this.status === 'caught') {
      this.spottedCount = 0;
      this.totalTime = 0;
      this.loadLevel(0);
      this.status = 'playing';
    }
  }

  handleKey(code) {
    this.sounds.ensure();
    if (code === 'KeyM') {
      this.sounds.toggleMute();
      return;
    }
    if (code === 'KeyR' && (this.status === 'playing' || this.status === 'caught')) {
      this.loadLevel(this.levelIndex);
      this.status = 'playing';
      return;
    }
    if (code === 'KeyP' && this.status === 'playing') {
      this.paused = !this.paused;
      return;
    }
    if (code === 'Enter' || code === 'Space') {
      if (this.status !== 'playing' || this.paused) this.start();
    }
  }

  handleClick() {
    this.sounds.ensure();
    if (this.status !== 'playing' || this.paused) {
      this.start();
      return;
    }
    const click = this.input.consumeClick();
    if (!click) return;
    // Clicking the HUD does nothing; clicking the floor throws a coin.
    if (click.py < 44 || click.py > VIEW_H - 22) return;
    if (this.world.isSolid(click.x, click.y)) return;
    if (this.player.throwCoin(click.x, click.y, this.guards)) {
      this.sounds.coin();
    }
  }

  update(dt) {
    if (this.status !== 'playing' || this.paused) return;
    this.time += dt;
    this.totalTime += dt;
    this.player.update(dt, this.world, this.input);
    this.player.broadcastRunNoise(this.guards);
    let events = [];
    for (const guard of this.guards) {
      events = events.concat(guard.update(dt, this.world, this.player));
    }
    for (const event of events) {
      if (event.type === 'suspicious') this.sounds.suspicious();
      if (event.type === 'spotted') {
        this.sounds.spotted();
        this.spottedCount += 1;
      }
      if (event.type === 'lost') this.sounds.suspicious();
    }
    // Footsteps: a soft tick each stride, quieter while sneaking.
    if (this.player.moving && Math.floor(this.player.stepPhase) !== this.lastStep) {
      this.lastStep = Math.floor(this.player.stepPhase);
      this.sounds.footstep(this.player.sneaking);
    }
    // Pocket a relic by walking over it.
    const relic = this.world.relicAt(Math.floor(this.player.x), Math.floor(this.player.y));
    if (relic) {
      this.world.takeRelic(relic);
      this.sounds.pickup();
      if (this.world.allRelicsTaken) this.sounds.exitOpen();
    }
    // Caught: a guard reached the thief.
    if (this.guards.some((g) => g.caughtPlayer)) {
      this.status = 'caught';
      this.sounds.caught();
      return;
    }
    // Escape: all relics pocketed and the thief stands on the exit.
    if (this.world.allRelicsTaken && this.world.atExit(this.player.x, this.player.y)) {
      if (this.levelIndex + 1 < LEVELS.length) {
        this.status = 'level-complete';
        this.sounds.win();
      } else {
        this.status = 'victory';
        this.sounds.win();
      }
    }
  }

  draw() {
    const ctx = this.renderer.ctx;
    this.renderer.draw(this, this.clock);
    if (this.paused && this.status === 'playing') {
      this.renderer.drawPaused(ctx);
    } else if (this.status === 'title') {
      this.renderer.drawTitle(ctx, this.level.name, this.level.intro);
    } else if (this.status === 'caught') {
      this.renderer.drawCaught(ctx);
    } else if (this.status === 'level-complete') {
      this.renderer.drawLevelComplete(ctx, this.level.name, this.time, this.spottedCount);
    } else if (this.status === 'victory') {
      this.renderer.drawVictory(ctx, this.totalTime, this.spottedCount);
    }
  }

  frame(now) {
    const dt = Math.min(0.1, (now - this.lastNow) / 1000 || 0);
    this.lastNow = now;
    this.clock += dt;
    // In a staged screenshot the world is frozen: draw once, never step.
    if (!shot) {
      this.accumulator += dt;
      while (this.accumulator >= STEP) {
        this.update(STEP);
        this.accumulator -= STEP;
      }
    }
    this.draw();
    requestAnimationFrame((t) => this.frame(t));
  }

  run() {
    this.lastStep = 0;
    requestAnimationFrame((t) => {
      this.lastNow = t;
      this.frame(t);
    });
  }
}

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const game = new Game(canvas);
// Expose the live game for play-testing from the console and automation.
window.__lanternlight = game;
game.run();

// The page background stays dark so the canvas sits in a gallery frame.
document.body.style.background = '#0b0d14';
document.title = 'Lanternlight — a stealth heist';
