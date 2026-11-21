// Lanternlight — everything the eye sees: the moonlit floor, the crates
// and shadows you hide behind, each guard's lantern cone swept by rays,
// the thief, the relics, the exit, the HUD and every screen.

import { COLORS, TILE, TUNING, VIEW_H, VIEW_W } from './config.js';
import { GUARD_STATE } from './guard.js';

const CONE_RAYS = 26;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dust = [];
  }

  seedDust(rng, count) {
    this.dust = [];
    for (let i = 0; i < count; i++) {
      this.dust.push({
        x: rng() * VIEW_W,
        y: rng() * VIEW_H,
        r: 0.6 + rng() * 1.4,
        drift: 2 + rng() * 5,
        phase: rng() * Math.PI * 2,
      });
    }
  }

  draw(game, time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.drawFloor(ctx, game.world);
    this.drawExit(ctx, game.world, game.allRelicsTaken, time);
    this.drawRelics(ctx, game.world, time);
    this.drawCrates(ctx, game.world);
    this.drawCones(ctx, game.world, game.guards);
    this.drawGuards(ctx, game.guards, time);
    this.drawPlayer(ctx, game.player, game.world, time);
    this.drawNoise(ctx, game.player);
    this.drawDust(ctx, time);
    this.drawWalls(ctx, game.world);
    this.drawHud(ctx, game);
  }

  drawFloor(ctx, world) {
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const tile = world.tileAt(x, y);
        const px = x * TILE;
        const py = y * TILE;
        if (tile === '#') continue;
        ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
        ctx.fillRect(px, py, TILE, TILE);
        if (tile === 'd') {
          ctx.fillStyle = COLORS.shadow;
          ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
          ctx.strokeStyle = COLORS.shadowEdge;
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 2.5, py + 2.5, TILE - 5, TILE - 5);
        }
      }
    }
  }

  drawWalls(ctx, world) {
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        if (world.tileAt(x, y) !== '#') continue;
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px, py, TILE, 6);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      }
    }
  }

  drawCrates(ctx, world) {
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        if (world.tileAt(x, y) !== 'c') continue;
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = COLORS.crateTop;
        ctx.fillRect(px + 2, py + 2, TILE - 4, 7);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 3.5, py + 3.5, TILE - 7, TILE - 7);
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 3);
        ctx.lineTo(px + TILE - 3, py + TILE - 3);
        ctx.moveTo(px + TILE - 3, py + 3);
        ctx.lineTo(px + 3, py + TILE - 3);
        ctx.stroke();
      }
    }
  }

  drawExit(ctx, world, open, time) {
    const ex = world.exit.x * TILE + TILE / 2;
    const ey = world.exit.y * TILE + TILE / 2;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    ctx.save();
    ctx.globalAlpha = open ? 0.75 + 0.25 * pulse : 0.35;
    const glow = ctx.createRadialGradient(ex, ey, 4, ex, ey, 44);
    glow.addColorStop(0, open ? COLORS.exitGlow : '#3a4a42');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(ex - 44, ey - 44, 88, 88);
    ctx.restore();
    ctx.fillStyle = open ? COLORS.exit : '#55665c';
    ctx.fillRect(ex - 11, ey - 13, 22, 26);
    ctx.fillStyle = '#0e2418';
    ctx.fillRect(ex - 6, ey - 8, 12, 16);
    ctx.fillStyle = open ? COLORS.exitGlow : '#8a9a90';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', ex, ey - 18);
  }

  drawRelics(ctx, world, time) {
    for (const relic of world.relics) {
      if (relic.taken) continue;
      const cx = relic.x * TILE + TILE / 2;
      const cy = relic.y * TILE + TILE / 2 + Math.sin(time * 2 + relic.x) * 2;
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
      glow.addColorStop(0, 'rgba(255, 215, 94, 0.55)');
      glow.addColorStop(1, 'rgba(255, 215, 94, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 26, cy - 26, 52, 52);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = COLORS.relic;
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }
  }

  coneColor(guard) {
    if (guard.state === GUARD_STATE.ALERT) return COLORS.coneAlert;
    if (guard.state === GUARD_STATE.SUSPICIOUS || guard.state === GUARD_STATE.SEARCH) {
      return COLORS.coneSuspicious;
    }
    return COLORS.coneCalm;
  }

  drawCones(ctx, world, guards) {
    for (const guard of guards) {
      const gx = guard.x * TILE;
      const gy = guard.y * TILE;
      const range = TUNING.viewRange * TILE;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      for (let i = 0; i <= CONE_RAYS; i++) {
        const angle = guard.angle - TUNING.viewHalfAngle + (2 * TUNING.viewHalfAngle * i) / CONE_RAYS;
        const dist = world.castRay(guard.x, guard.y, angle, TUNING.viewRange) * TILE;
        ctx.lineTo(gx + Math.cos(angle) * dist, gy + Math.sin(angle) * dist);
      }
      ctx.closePath();
      ctx.fillStyle = this.coneColor(guard);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 200, 110, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      const lantern = ctx.createRadialGradient(gx, gy, 2, gx, gy, 46);
      lantern.addColorStop(0, 'rgba(255, 179, 71, 0.5)');
      lantern.addColorStop(1, 'rgba(255, 179, 71, 0)');
      ctx.fillStyle = lantern;
      ctx.beginPath();
      ctx.arc(gx, gy, 46, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGuards(ctx, guards, time) {
    for (const guard of guards) {
      const gx = guard.x * TILE;
      const gy = guard.y * TILE;
      const bob = Math.sin(time * 6 + guard.x) * 1.2;
      ctx.save();
      ctx.translate(gx, gy + bob * 0.4);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.guard;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a2d26';
      ctx.beginPath();
      ctx.arc(0, -3, 7, Math.PI, 0);
      ctx.fill();
      // Lantern held ahead.
      const lx = Math.cos(guard.angle) * 15;
      const ly = Math.sin(guard.angle) * 15;
      ctx.fillStyle = COLORS.guardLantern;
      ctx.beginPath();
      ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff2c4';
      ctx.beginPath();
      ctx.arc(lx, ly, 2, 0, Math.PI * 2);
      ctx.fill();
      // Eyes look where the guard looks.
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(Math.cos(guard.angle) * 4 - Math.sin(guard.angle) * 3.5, Math.sin(guard.angle) * 4 + Math.cos(guard.angle) * 3.5, 1.8, 0, Math.PI * 2);
      ctx.arc(Math.cos(guard.angle) * 4 + Math.sin(guard.angle) * 3.5, Math.sin(guard.angle) * 4 - Math.cos(guard.angle) * 3.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Suspicion marks float above the head.
      if (guard.state === GUARD_STATE.ALERT) {
        this.drawMark(ctx, gx, gy - 24, '!', COLORS.danger);
      } else if (guard.state === GUARD_STATE.SUSPICIOUS || guard.state === GUARD_STATE.SEARCH) {
        this.drawMark(ctx, gx, gy - 24, '?', COLORS.gold);
      }
      // Suspicion bar under the guard.
      if (guard.suspicion > 2) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(gx - 14, gy + 14, 28, 5);
        ctx.fillStyle = guard.suspicion >= TUNING.suspiciousAt ? COLORS.danger : COLORS.gold;
        ctx.fillRect(gx - 13, gy + 15, 26 * (guard.suspicion / 100), 3);
      }
    }
  }

  drawMark(ctx, x, y, text, color) {
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  drawPlayer(ctx, player, world, time) {
    const px = player.x * TILE;
    const py = player.y * TILE;
    const bob = player.moving ? Math.sin(player.stepPhase) * 1.6 : Math.sin(time * 2) * 0.8;
    const inShadow = world.isShadow(Math.floor(player.x), Math.floor(player.y));
    ctx.save();
    ctx.translate(px, py + bob * 0.3);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cloak.
    ctx.fillStyle = player.sneaking ? '#2c4a68' : COLORS.playerCloak;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(10, 9);
    ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();
    // Hood and face.
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(0, -4, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c2436';
    ctx.beginPath();
    ctx.arc(Math.cos(player.angle) * 2.5, -4 + Math.sin(player.angle) * 2.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (inShadow) {
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8fa3c8';
      ctx.fillText('HIDDEN', px, py - 20);
    }
    if (player.sneaking) {
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9aa3b8';
      ctx.fillText('SNEAKING', px, py + 24);
    }
  }

  drawNoise(ctx, player) {
    if (player.noisePulse <= 0) return;
    const px = player.x * TILE;
    const py = player.y * TILE;
    ctx.strokeStyle = `rgba(255, 120, 90, ${0.5 * (player.noisePulse / TUNING.runNoiseRadius)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, player.noisePulse * TILE, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawDust(ctx, time) {
    ctx.fillStyle = 'rgba(220, 225, 255, 0.25)';
    for (const mote of this.dust) {
      const y = mote.y + Math.sin(time * 0.3 + mote.phase) * 3;
      const x = mote.x + Math.sin(time * 0.2 + mote.phase * 2) * mote.drift;
      ctx.beginPath();
      ctx.arc(x, y, mote.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHud(ctx, game) {
    const ctx2 = ctx;
    ctx2.fillStyle = COLORS.hudBg;
    ctx2.fillRect(0, 0, VIEW_W, 44);
    ctx2.fillStyle = COLORS.hudText;
    ctx2.font = 'bold 15px sans-serif';
    ctx2.textAlign = 'left';
    ctx2.fillText(`LANTERNLIGHT  ·  ${game.level.name}`, 12, 19);
    ctx2.font = '13px sans-serif';
    ctx2.fillStyle = COLORS.hudMuted;
    ctx2.fillText(`Level ${game.levelIndex + 1}/3`, 12, 36);
    // Relics.
    const relicsText = `◆ ${game.world.relicsLeft} relic${game.world.relicsLeft === 1 ? '' : 's'} left`;
    ctx2.font = 'bold 14px sans-serif';
    ctx2.fillStyle = game.world.allRelicsTaken ? COLORS.exitGlow : COLORS.relic;
    ctx2.textAlign = 'center';
    ctx2.fillText(relicsText, VIEW_W / 2 - 60, 28);
    // Coins.
    ctx2.fillStyle = COLORS.hudText;
    ctx2.fillText(`● ${game.player.coins} coins`, VIEW_W / 2 + 90, 28);
    // Timer and spotted count, top line on the right.
    ctx2.textAlign = 'right';
    ctx2.fillStyle = COLORS.hudText;
    ctx2.fillText(`${formatTime(game.time)}   spotted ${game.spottedCount}×`, VIEW_W - 12, 19);
    // Detection: the hottest guard's suspicion, on its own row below.
    const hottest = Math.max(0, ...game.guards.map((g) => g.suspicion));
    const barX = VIEW_W - 190;
    const barY = 36;
    ctx2.fillStyle = 'rgba(255,255,255,0.14)';
    ctx2.fillRect(barX, barY - 4, 150, 6);
    ctx2.fillStyle = hottest >= TUNING.suspiciousAt ? COLORS.danger : COLORS.gold;
    ctx2.fillRect(barX, barY - 4, 150 * (hottest / 100), 6);
    ctx2.font = '10px sans-serif';
    ctx2.fillStyle = COLORS.hudMuted;
    ctx2.textAlign = 'left';
    ctx2.fillText('SEEN', barX - 34, barY + 2);
    // Bottom hint.
    ctx2.fillStyle = 'rgba(10,12,20,0.6)';
    ctx2.fillRect(0, VIEW_H - 22, VIEW_W, 22);
    ctx2.fillStyle = COLORS.hudMuted;
    ctx2.font = '12px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(
      'WASD move · Shift sneak · Space run (loud!) · Click to throw a coin · P pause · R restart',
      VIEW_W / 2,
      VIEW_H - 7,
    );
    // Exit reminder once the relics are all pocketed.
    if (game.world.allRelicsTaken && game.status === 'playing') {
      ctx2.font = 'bold 15px sans-serif';
      ctx2.fillStyle = COLORS.exitGlow;
      ctx2.textAlign = 'center';
      ctx2.fillText('All relics pocketed — reach the green EXIT!', VIEW_W / 2, 66);
    }
  }

  panel(ctx, title, lines, accent) {
    ctx.fillStyle = 'rgba(8, 10, 18, 0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = 'rgba(16, 19, 32, 0.95)';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    const w = 620;
    const h = 120 + lines.length * 30;
    const x = (VIEW_W - w) / 2;
    const y = (VIEW_H - h) / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(title, VIEW_W / 2, y + 52);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = COLORS.hudText;
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, y + 92 + i * 30));
    return { x, y, w, h };
  }

  drawTitle(ctx, levelName, intro) {
    const panel = this.panel(
      ctx,
      'LANTERNLIGHT',
      [
        'A velvet-gloved heist in three galleries.',
        `${levelName} — ${intro}`,
        'Slip past the lanterns. Pocket every relic. Reach the exit unseen.',
        'WASD move · Shift sneak · Space run (loud) · Click throws a coin',
        '',
        'Click or press Enter to begin',
      ],
      COLORS.gold,
    );
    return panel;
  }

  drawCaught(ctx) {
    return this.panel(
      ctx,
      'SPOTTED!',
      ['A lantern found you. The gallery wakes, and the heist is over.', '', 'Press R or click to try the level again'],
      COLORS.danger,
    );
  }

  drawLevelComplete(ctx, levelName, time, spotted) {
    return this.panel(
      ctx,
      'CLEAN GETAWAY',
      [
        `${levelName} — cleared in ${formatTime(time)} with ${spotted} alarm${spotted === 1 ? '' : 's'}.`,
        '',
        'Press Enter or click for the next gallery',
      ],
      COLORS.exit,
    );
  }

  drawVictory(ctx, totalTime, spotted) {
    return this.panel(
      ctx,
      'THE COLLECTION IS YOURS',
      [
        'Three galleries, three getaways, not a single guard the wiser.',
        `Total time ${formatTime(totalTime)} · alarms raised ${spotted}`,
        '',
        'Press Enter or click to play again',
      ],
      COLORS.gold,
    );
  }

  drawPaused(ctx) {
    return this.panel(ctx, 'PAUSED', ['The guards wait. So do you.', '', 'Press P to keep sneaking'], COLORS.hudMuted);
  }
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
