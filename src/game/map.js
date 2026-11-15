// The shape of Troy. Edit numbers in this file to move a building.
// Tiles are 16×16. The map is 60 across and 59 down (960×944 pixels).
// y = 0 is the north edge. The sea is the bottom of the map.
// The plaza between the horse and the gate is long on purpose, so the
// walk south to the gate has a pace instead of a few steps.
// That walk bends: west, then east, then back to the gate. Houses and
// trees close the straight line, so the bend is the way through.

export const TILE = 16;
export const COLS = 60;
export const ROWS = 59;
export const MAP_W = COLS * TILE;
export const MAP_H = ROWS * TILE;

// Invisible box under Odysseus. Only his feet, so his picture can overlap
// the tops of columns and roofs. Narrower than a tile, so he slides in a
// lane instead of catching every seam. Kept in one place so the scene and
// the route check agree.
export const FEET = { w: 10, h: 6 };

// Tile indexes. They must match the painters in textures.js.
// The ground colors are warm and light. A blue multiply in TroyScene
// turns them into moonlight. Do not paint these tiles black.
export const T = {
  earth: 0,
  earthAlt: 1,
  sand: 2,
  sandAlt: 3,
  wet: 4,
  water: 5,
  waterDeep: 6,
  road: 7,
  wall: 8,
  battlement: 9,
  wallFace: 10,
  rock: 11,
  pebble: 12,
  pave: 13,
  paveAlt: 14,
  weed: 15,
  roadSide: 16,
};

// Odysseus can walk these. Every other index is solid.
export const WALKABLE = new Set([
  T.earth,
  T.earthAlt,
  T.sand,
  T.sandAlt,
  T.wet,
  T.road,
  T.pebble,
  T.pave,
  T.paveAlt,
  T.weed,
  T.roadSide,
]);

// Opening in the great wall, in tile columns, inclusive.
export const GATE = { left: 26, right: 33 };
// The wall itself, in tile rows, inclusive. North of this is the city.
// It sits well south of the horse so the road to the gate is a real walk.
export const WALL = { top: 37, bottom: 40 };

// Beach, on the road, just south of the gate. The voyage starts in the horse.
export const SPAWN = { x: 480, y: 694 };

// The painted house is 60×64. The solid box is that whole picture, so his
// feet stop at the walls and the roof instead of walking through them.
const HOUSE_W = 60;
const HOUSE_H = 64;

// id must match a picture in textures.js.
// baseY is the bottom of the picture (the ground contact).
// The solid box sits on that ground and is `insetBottom` pixels shorter,
// so a doorstep or a column shaft can stick out past the box.
export const PROPS = [
  // Steps and the column bases. The roof above this can draw over him.
  { id: 'temple', x: 480, baseY: 148, bodyW: 96, bodyH: 36, insetBottom: 0 },

  { id: 'house', x: 120, baseY: 156, bodyW: HOUSE_W, bodyH: HOUSE_H, insetBottom: 0 },
  { id: 'houseAlt', x: 214, baseY: 250, bodyW: HOUSE_W, bodyH: HOUSE_H, insetBottom: 0 },
  { id: 'house', x: 840, baseY: 156, bodyW: HOUSE_W, bodyH: HOUSE_H, insetBottom: 0 },
  { id: 'houseAlt', x: 746, baseY: 250, bodyW: HOUSE_W, bodyH: HOUSE_H, insetBottom: 0 },

  // Three fences across the plaza. Each one leaves a gap on the zigzag.
  ...fence(392, 11, 19),
  ...fence(488, 41, 49),
  // Far enough south of the row above that the two pictures do not touch.
  // A full-height house on the old line sat on that row and closed the lane.
  ...fence(576, 25, 35),

  // Columns stand by the temple, north of the horse.
  { id: 'column', x: 400, baseY: 124, bodyW: 12, bodyH: 8, insetBottom: 0 },
  { id: 'column', x: 560, baseY: 124, bodyW: 12, bodyH: 8, insetBottom: 0 },
  { id: 'column', x: 436, baseY: 112, bodyW: 12, bodyH: 8, insetBottom: 0 },
  { id: 'column', x: 524, baseY: 112, bodyW: 12, bodyH: 8, insetBottom: 0 },
  { id: 'column', x: 340, baseY: 136, bodyW: 12, bodyH: 8, insetBottom: 0 },
  { id: 'column', x: 620, baseY: 136, bodyW: 12, bodyH: 8, insetBottom: 0 },

  // PixelLab horse, south frame. The picture is 128px tall. The solid box
  // is only the platform and wheels, so feet can pass behind the head.
  { id: 'horse', x: 480, baseY: 228, bodyW: 66, bodyH: 30, insetBottom: 0 },

  { id: 'rubble', x: 220, baseY: 200, bodyW: 24, bodyH: 10, insetBottom: 0 },
  { id: 'rubble', x: 740, baseY: 190, bodyW: 24, bodyH: 10, insetBottom: 0 },
  { id: 'rubble', x: 120, baseY: 754, bodyW: 24, bodyH: 10, insetBottom: 0 },
  { id: 'rubble', x: 860, baseY: 754, bodyW: 24, bodyH: 10, insetBottom: 0 },

  // Unlit bowls on the beach. A few lamps live in LAMPS.
  { id: 'brazier', x: 200, baseY: 724, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'brazier', x: 760, baseY: 714, bodyW: 10, bodyH: 8, insetBottom: 0 },

  { id: 'cypress', x: 250, baseY: 132, bodyW: 6, bodyH: 6, insetBottom: 0 },
  { id: 'cypress', x: 710, baseY: 132, bodyW: 6, bodyH: 6, insetBottom: 0 },
  { id: 'cypress', x: 140, baseY: 724, bodyW: 6, bodyH: 6, insetBottom: 0 },
  { id: 'cypress', x: 840, baseY: 729, bodyW: 6, bodyH: 6, insetBottom: 0 },

  // Trees along the bends, set just off the stones so the lane stays open.
  { id: 'cypress', x: 160, baseY: 330, bodyW: 6, bodyH: 6, insetBottom: 0 },
  { id: 'cypress', x: 320, baseY: 360, bodyW: 6, bodyH: 6, insetBottom: 0 },
  { id: 'cypress', x: 176, baseY: 400, bodyW: 6, bodyH: 6, insetBottom: 0 },
  { id: 'cypress', x: 640, baseY: 450, bodyW: 6, bodyH: 6, insetBottom: 0 },
  { id: 'cypress', x: 800, baseY: 470, bodyW: 6, bodyH: 6, insetBottom: 0 },
  { id: 'cypress', x: 390, baseY: 530, bodyW: 6, bodyH: 6, insetBottom: 0 },
  { id: 'cypress', x: 590, baseY: 540, bodyW: 6, bodyH: 6, insetBottom: 0 },
  { id: 'cypress', x: 860, baseY: 360, bodyW: 6, bodyH: 6, insetBottom: 0 },
];

// Pictures with no collision of their own. They stand on tiles that are
// already solid (the wall).
export const DECOR = [
  { id: 'tower', x: GATE.left * TILE - 16, baseY: (WALL.bottom + 1) * TILE },
  { id: 'tower', x: (GATE.right + 1) * TILE + 16, baseY: (WALL.bottom + 1) * TILE },
];

// How close his feet must be before "Press E" shows up.
// One spot can use a different radius. This number is the usual one.
export const INTERACT_RADIUS = 28;

// Spots he can use. x and y are pixels, the same kind of numbers as SPAWN.
// To add one, copy an entry, change id, and set x/y to where he should stand.
// type tells React what to open later (a gate, a place, a hatch, ...).
// Gate center: columns 26 through 33. (26 + 33 + 1) / 2 * 16 = 480.
const GATE_X = ((GATE.left + GATE.right + 1) / 2) * TILE;
// One tile south of the wall, on the road, so his feet can reach it.
const GATE_Y = (WALL.bottom + 1) * TILE + 8;

export const INTERACTABLES = [
  {
    id: 'gate',
    x: GATE_X,
    y: GATE_Y,
    radius: INTERACT_RADIUS,
    prompt: 'Press E to look through the gate',
    type: 'gate',
  },
  {
    id: 'temple',
    x: 480,
    y: 176,
    radius: INTERACT_RADIUS,
    prompt: 'Press E to approach the temple',
    type: 'place',
  },
  // Just south of the horse wheels (the horse prop is x 480, baseY 228).
  // Press E here to climb into the belly. The hatch inside asks a question
  // before onTrapDoor() in HorseScene.js lets him back out.
  {
    id: 'horse_hatch',
    x: 480,
    y: 252,
    radius: 36,
    prompt: 'Press E to climb inside',
    type: 'hatch',
  },
];

// Every entry is a real standing lamp. The glow is drawn on its flame.
// The Greeks opened the gate quietly. Nothing is on fire.
export const LAMPS = [
  // On the west bend, then the east bend.
  { x: 240, y: 370 },
  { x: 720, y: 500 },
  // On the paving beside the temple colonnade, not on the horse.
  { x: 390, y: 150 },
];

// A row of houses across the plaza. gapTileLeft/Right is the opening, in tiles.
function fence(baseY, gapTileLeft, gapTileRight) {
  const row = [];
  let n = 0;
  // 62px apart, each house fills its 60px picture. The 2px crack is narrower
  // than his feet, so the opening left in the row is the only way through.
  for (let x = 40; x <= 920; x += 62) {
    const centerTile = x / TILE;
    if (centerTile > gapTileLeft && centerTile < gapTileRight) continue;
    row.push({
      id: n % 2 === 0 ? 'house' : 'houseAlt',
      x,
      baseY,
      bodyW: HOUSE_W,
      bodyH: HOUSE_H,
      insetBottom: 0,
    });
    // A tree behind every other roof, so the row is not one flat wall.
    if (n % 2 === 0) {
      row.push({
        id: 'cypress',
        x: x - 10,
        baseY: baseY - 30,
        bodyW: 6,
        bodyH: 6,
        insetBottom: 0,
      });
    }
    n += 1;
  }
  return row;
}

function earthKind(x, y) {
  const n = (x * 5 + y * 3) % 11;
  if (n === 0) return T.earthAlt;
  if (n === 4) return T.pebble;
  return T.earth;
}

export function buildMap() {
  const grid = [];
  for (let y = 0; y < ROWS; y += 1) {
    const row = [];
    for (let x = 0; x < COLS; x += 1) row.push(earthKind(x, y));
    grid.push(row);
  }

  // Pale limestone in the plaza, up to the wall. The road is painted after this.
  fillRect(grid, 12, 3, 36, WALL.top - 3, (x, y) => ((x + y) % 2 === 0 ? T.paveAlt : T.pave));

  // Beach, then the surf, then the sea. Only the blue water is solid.
  const shore = WALL.bottom + 1;
  fillRect(grid, 0, shore, COLS, 7, (x, y) => ((x * 3 + y) % 8 === 0 ? T.sandAlt : T.sand));
  fillRect(grid, 0, shore + 7, COLS, 2, () => T.wet);
  fillRect(grid, 0, shore + 9, COLS, 4, () => T.water);
  fillRect(grid, 0, shore + 13, COLS, 5, () => T.waterDeep);

  // Back wall of this district.
  fillRect(grid, 0, 0, COLS, 1, () => T.battlement);
  fillRect(grid, 0, 1, COLS, 1, () => T.wallFace);

  // The great wall, with the stone road continuing through the open gate.
  for (let y = WALL.top; y <= WALL.bottom; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const inGate = x >= GATE.left && x <= GATE.right;
      if (inGate) grid[y][x] = T.road;
      else if (y === WALL.top) grid[y][x] = T.battlement;
      else if (y === WALL.bottom) grid[y][x] = T.wallFace;
      else grid[y][x] = T.wall;
    }
  }

  // The road leaves the horse, bends west, crosses to the east, then
  // comes back to the gate. The beach beyond the wall stays straight.
  roadRect(grid, 24, 15, 12, 5);
  roadRect(grid, 12, 18, 24, 4);
  roadRect(grid, 12, 18, 6, 8);
  roadRect(grid, 12, 25, 36, 4);
  roadRect(grid, 42, 25, 6, 8);
  roadRect(grid, 26, 31, 22, 4);
  roadRect(grid, 26, 31, 8, 6);
  for (let y = WALL.bottom + 1; y <= WALL.bottom + 7; y += 1) {
    for (let x = GATE.left; x <= GATE.right; x += 1) grid[y][x] = T.road;
  }

  // Dry weeds along the foot of the wall, and a few cracks in the paving.
  for (let x = 2; x < COLS - 2; x += 1) {
    if (x >= GATE.left - 1 && x <= GATE.right + 1) continue;
    if (x % 4 === 0) grid[WALL.top - 1][x] = T.weed;
    if (x % 5 === 2 && grid[WALL.bottom + 1]) grid[WALL.bottom + 1][x] = T.weed;
  }
  const cracks = [[20, 8], [36, 7], [24, 12], [40, 11], [18, WALL.bottom + 1], [44, WALL.bottom]];
  for (const [x, y] of cracks) {
    if (WALKABLE.has(grid[y][x]) && grid[y][x] !== T.road) grid[y][x] = T.pebble;
  }

  // Solid rocks: map edges on land, plus a few boulders off the path.
  for (let y = 0; y < WALL.bottom + 10; y += 1) {
    if (y >= WALL.top && y <= WALL.bottom) continue;
    grid[y][0] = T.rock;
    grid[y][COLS - 1] = T.rock;
  }
  const rocks = [
    [6, 44], [54, 45],
    [8, 8], [51, 9], [12, 12], [48, 13],
    [6, 52], [20, 56], [42, 55], [54, 53],
  ];
  for (const [x, y] of rocks) grid[y][x] = T.rock;

  return grid;
}

function roadRect(grid, x, y, w, h) {
  for (let yy = y; yy < y + h; yy += 1) {
    if (yy < 0 || yy >= ROWS) continue;
    if (yy >= WALL.top && yy <= WALL.bottom) continue;
    for (let xx = x; xx < x + w; xx += 1) {
      if (xx < 1 || xx >= COLS - 1) continue;
      grid[yy][xx] = T.road;
    }
  }
}

function fillRect(grid, x0, y0, w, h, pick) {
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) grid[y][x] = pick(x, y);
  }
}

// Solid tiles joined into rectangles. One long wall, not a tile per step,
// so walking along it does not snag on the cracks between tiles.
export function solidRects(grid = buildMap()) {
  const rows = grid.length;
  const cols = grid[0].length;
  const used = Array.from({ length: rows }, () => new Uint8Array(cols));
  const rects = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (used[y][x] || WALKABLE.has(grid[y][x])) continue;
      let w = 1;
      while (x + w < cols && !used[y][x + w] && !WALKABLE.has(grid[y][x + w])) w += 1;
      let h = 1;
      while (y + h < rows) {
        let rowOk = true;
        for (let i = 0; i < w; i += 1) {
          if (used[y + h][x + i] || WALKABLE.has(grid[y + h][x + i])) {
            rowOk = false;
            break;
          }
        }
        if (!rowOk) break;
        h += 1;
      }
      for (let yy = y; yy < y + h; yy += 1) {
        for (let xx = x; xx < x + w; xx += 1) used[yy][xx] = 1;
      }
      rects.push({ x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE });
    }
  }
  return rects;
}
