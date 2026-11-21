// Lanternlight — keyboard and mouse, kept in one place so the game loop
// never touches a DOM event directly.
//   WASD / arrows — move        Shift — sneak        Space — run (loud)
//   Click a floor tile — throw a coin there (guards come to listen).
//   P pause, R restart level, M mute, Enter start / next.

export class Input {
  constructor(canvas) {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.sneak = false;
    this.run = false;
    this.keys = new Set();
    this.clickTile = null;
    this.canvas = canvas;
    this.onKey = null;
    this.onClick = null;
    this.attach();
  }

  attach() {
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.keys.add(event.code);
      this.sync();
      if (this.onKey) this.onKey(event.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      this.sync();
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.sync();
    });
    this.canvas.addEventListener('mousedown', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const px = (event.clientX - rect.left) * scaleX;
      const py = (event.clientY - rect.top) * scaleY;
      this.clickTile = { x: Math.floor(px / 32), y: Math.floor(py / 32), px, py };
      if (this.onClick) this.onClick(this.clickTile);
    });
  }

  sync() {
    const k = this.keys;
    this.up = k.has('KeyW') || k.has('ArrowUp');
    this.down = k.has('KeyS') || k.has('ArrowDown');
    this.left = k.has('KeyA') || k.has('ArrowLeft');
    this.right = k.has('KeyD') || k.has('ArrowRight');
    this.sneak = k.has('ShiftLeft') || k.has('ShiftRight');
    this.run = k.has('Space');
  }

  consumeClick() {
    const click = this.clickTile;
    this.clickTile = null;
    return click;
  }
}
