// Lanternlight — the three heists.
// Levels are built from coordinates, never pasted ASCII art, so a wall is
// always where its numbers say it is. Tiles:
//   '#' wall   '.' floor   'c' crate (cover: blocks feet and sight)
//   'd' shadow floor (dark: a crouched thief is hard to spot there)
//   'P' player start   'R' relic   'E' exit   'G' guard spawn
// Guard patrols are waypoint loops in tile coordinates.

function makeGrid(width, height) {
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(x === 0 || y === 0 || x === width - 1 || y === height - 1 ? '#' : '.');
    }
    grid.push(row);
  }
  return grid;
}

function vWall(grid, x, y0, y1, gaps = []) {
  for (let y = y0; y <= y1; y++) if (!gaps.includes(y)) grid[y][x] = '#';
}

function hWall(grid, y, x0, x1, gaps = []) {
  for (let x = x0; x <= x1; x++) if (!gaps.includes(x)) grid[y][x] = '#';
}

function block(grid, x, y, w, h, ch) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) grid[y + dy][x + dx] = ch;
  }
}

function place(grid, x, y, ch) {
  grid[y][x] = ch;
}

function finish(grid, name, intro, player, relics, exit, guards) {
  for (const g of guards) place(grid, g.x, g.y, 'G');
  place(grid, player[0], player[1], 'P');
  for (const [rx, ry] of relics) place(grid, rx, ry, 'R');
  place(grid, exit[0], exit[1], 'E');
  return {
    name,
    intro,
    width: grid[0].length,
    height: grid.length,
    rows: grid.map((row) => row.join('')),
    player: { x: player[0], y: player[1] },
    relics: relics.map(([x, y]) => ({ x, y, taken: false })),
    exit: { x: exit[0], y: exit[1] },
    guards: guards.map((g) => ({
      x: g.x,
      y: g.y,
      waypoints: g.waypoints,
      pause: g.pause ?? 1.2,
    })),
  };
}

function buildGallery() {
  const g = makeGrid(30, 20);
  // Two long gallery walls split the hall into three rooms, with doors.
  vWall(g, 13, 1, 18, [10]);
  vWall(g, 21, 1, 18, [4, 15]);
  // A low partition in the west room, for cover.
  hWall(g, 7, 2, 11, [6]);
  // Crate stacks to duck behind.
  block(g, 5, 4, 2, 2, 'c');
  block(g, 25, 5, 2, 2, 'c');
  block(g, 5, 10, 2, 2, 'c');
  block(g, 24, 13, 2, 2, 'c');
  // Pools of shadow where the lanterns do not reach.
  block(g, 15, 4, 3, 2, 'd');
  block(g, 3, 15, 4, 2, 'd');
  block(g, 24, 8, 3, 2, 'd');
  return finish(
    g,
    'The Velvet Gallery',
    'Two relics hang in the east wing. Pocket them both, then slip out the south door.',
    [1, 1],
    [
      [26, 2],
      [26, 11],
    ],
    [28, 18],
    [
      { x: 17, y: 6, waypoints: [[17, 3], [17, 16]] },
      { x: 5, y: 16, waypoints: [[8, 16], [11, 16], [11, 8], [8, 8]] },
    ],
  );
}

function buildVault() {
  const g = makeGrid(30, 20);
  vWall(g, 10, 1, 18, [6, 14]);
  vWall(g, 20, 1, 18, [3, 17]);
  hWall(g, 10, 11, 19, [15]);
  hWall(g, 5, 22, 28, [25]);
  block(g, 4, 3, 2, 2, 'c');
  block(g, 14, 2, 2, 2, 'c');
  block(g, 26, 7, 2, 2, 'c');
  block(g, 3, 14, 2, 2, 'c');
  block(g, 15, 14, 2, 2, 'c');
  block(g, 27, 15, 2, 2, 'c');
  block(g, 12, 7, 4, 2, 'd');
  block(g, 2, 17, 4, 2, 'd');
  block(g, 23, 11, 4, 2, 'd');
  return finish(
    g,
    'The Sunken Vault',
    'Three relics, three guards, one flooded vault. The east guard never stops walking.',
    [1, 1],
    [
      [28, 1],
      [15, 18],
      [28, 12],
    ],
    [1, 18],
    [
      { x: 5, y: 8, waypoints: [[5, 6], [5, 17]] },
      { x: 15, y: 12, waypoints: [[12, 12], [18, 12], [18, 17], [12, 17]] },
      { x: 25, y: 4, waypoints: [[25, 2], [25, 17]] },
    ],
  );
}

function buildRoof() {
  const g = makeGrid(30, 20);
  vWall(g, 8, 1, 18, [5, 15]);
  vWall(g, 15, 1, 18, [9]);
  vWall(g, 22, 1, 18, [4, 13]);
  hWall(g, 6, 16, 21, [19]);
  hWall(g, 13, 1, 7, [4]);
  hWall(g, 13, 23, 28, [24, 28]);
  block(g, 2, 3, 2, 2, 'c');
  block(g, 11, 2, 2, 2, 'c');
  block(g, 20, 8, 2, 2, 'c');
  block(g, 25, 6, 2, 2, 'c');
  block(g, 4, 16, 2, 2, 'c');
  block(g, 18, 15, 2, 2, 'c');
  block(g, 26, 15, 2, 2, 'c');
  block(g, 9, 8, 4, 2, 'd');
  block(g, 17, 2, 3, 2, 'd');
  block(g, 24, 9, 3, 2, 'd');
  block(g, 2, 10, 3, 2, 'd');
  return finish(
    g,
    'The Starlight Roof',
    'The last heist: four guards under open sky. Move like moonlight — seen never, heard never.',
    [1, 18],
    [
      [28, 1],
      [11, 18],
      [28, 10],
    ],
    [28, 18],
    [
      { x: 4, y: 5, waypoints: [[4, 2], [4, 11]] },
      { x: 12, y: 8, waypoints: [[10, 8], [13, 8], [13, 16], [10, 16]] },
      { x: 19, y: 5, waypoints: [[19, 2], [19, 11]] },
      { x: 26, y: 12, waypoints: [[24, 12], [28, 12], [28, 17], [24, 17]] },
    ],
  );
}

export const LEVELS = [buildGallery(), buildVault(), buildRoof()];

export function levelByName(name) {
  return LEVELS.find((level) => level.name === name) ?? LEVELS[0];
}
