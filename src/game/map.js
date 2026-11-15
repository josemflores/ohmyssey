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
// the tops of columns and roofs. Kept in one place so the scene and the
// route check agree.
export const FEET = { w: 16, h: 10 };

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

// id must match a picture in textures.js.
// baseY is the bottom of the picture (the ground contact).
// The solid box sits on that ground and is `insetBottom` pixels shorter,
// so a doorstep or a column shaft can stick out past the box.
export const PROPS = [
  { id: 'temple', x: 480, baseY: 148, bodyW: 88, bodyH: 52, insetBottom: 8 },

  house(120, 156),
  house('houseAlt', 214, 250),
  house(840, 156),
  house('houseAlt', 746, 250),

  // Beside the diagonal, clear of the stones. The box matches the picture
  // so his feet cannot stand on a roof.
  house(640, 300),
  house('houseAlt', 140, 340),
  house(700, 400),
  house('houseAlt', 120, 460),
  house(800, 500),
  house(200, 520),
  house('houseAlt', 840, 560),
  house(360, 250),

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

  // Wooden doors in the wall opening. He opens them from the north side.
  { id: 'gate-door', x: 480, baseY: 652, bodyW: 120, bodyH: 64, insetBottom: 0 },

  { id: 'rubble', x: 220, baseY: 200, bodyW: 26, bodyH: 12, insetBottom: 2 },
  { id: 'rubble', x: 740, baseY: 190, bodyW: 26, bodyH: 12, insetBottom: 2 },
  { id: 'rubble', x: 120, baseY: 754, bodyW: 28, bodyH: 12, insetBottom: 2 },
  { id: 'rubble', x: 860, baseY: 754, bodyW: 28, bodyH: 12, insetBottom: 2 },

  // Unlit bowls on the beach. A few lamps live in LAMPS.
  { id: 'brazier', x: 200, baseY: 724, bodyW: 14, bodyH: 10, insetBottom: 0 },
  { id: 'brazier', x: 760, baseY: 714, bodyW: 14, bodyH: 10, insetBottom: 0 },

  { id: 'cypress', x: 250, baseY: 132, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 710, baseY: 132, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 140, baseY: 724, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 840, baseY: 729, bodyW: 10, bodyH: 8, insetBottom: 0 },

  // Trees beside the diagonal, clear of the stones.
  { id: 'cypress', x: 560, baseY: 280, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 200, baseY: 320, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 120, baseY: 400, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 760, baseY: 440, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 600, baseY: 520, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 360, baseY: 560, bodyW: 10, bodyH: 8, insetBottom: 0 },
];

// The picture is 60×64. The box covers that, or he walks onto the roof.
function house(id, x, baseY) {
  const name = typeof id === 'number' ? 'house' : id;
  const px = typeof id === 'number' ? id : x;
  const py = typeof id === 'number' ? x : baseY;
  return { id: name, x: px, baseY: py, bodyW: 58, bodyH: 60, insetBottom: 2 };
}

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
// He stands just north of the doors, inside the city.
const GATE_Y = WALL.top * TILE - 12;
// The doors themselves. The arrow points here.
export const GATE_MARK = {
  x: GATE_X,
  y: ((WALL.top + WALL.bottom) / 2) * TILE + 8,
};

export const INTERACTABLES = [
  {
    id: 'gate',
    x: GATE_X,
    y: GATE_Y,
    radius: INTERACT_RADIUS,
    prompt: 'Press E to open the gate',
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
  // He can climb in only before the hatch has let him out.
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
  // Beside the diagonal, not on the stones.
  { x: 200, y: 360 },
  { x: 700, y: 480 },
  // On the paving beside the temple colonnade, not on the horse.
  { x: 390, y: 150 },
];

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

  // A short diagonal: southwest from the horse, southeast, then back
  // into the gate. The beach beyond the wall stays straight.
  roadLine(grid, 30, 16, 15, 25, 5);
  roadLine(grid, 15, 25, 40, 33, 5);
  roadLine(grid, 40, 33, 30, 36, 5);
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

function roadLine(grid, x0, y0, x1, y1, thick) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  const half = Math.floor(thick / 2);
  for (let i = 0; i <= steps; i += 1) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps);
    const y = Math.round(y0 + ((y1 - y0) * i) / steps);
    roadRect(grid, x - half, y - half, thick, thick);
  }
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
