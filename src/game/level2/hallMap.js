// The great hall of Odysseus's palace (a megaron), inside Level 2.
//
// It lives in the same Phaser scene as the island, to the east of the
// island map, so Odysseus keeps his sprite, his story state and his
// controls when he walks in. HALL.x / HALL.y place it in the world; every
// position below is in world pixels.
//
// Layout, north to south: the throne on a dais at the north wall, the
// round hearth in the middle ringed by four columns, banquet tables down
// both sides with the suitors, Penelope's loom and the great bow in the
// corners, braziers on the walls, and the doors at the south.
//
// No Phaser here, so scripts/check-level2.js can walk it in node.

export const TILE = 16;
export const HALL_COLS = 30;
export const HALL_ROWS = 22;
export const HALL = { x: 1200, y: 0, w: HALL_COLS * TILE, h: HALL_ROWS * TILE };

// Same feet box as the island and Troy.
export const FEET = { w: 16, h: 10 };

// Tile kinds. Walls are solid; floor and dais are walkable.
export const H = {
  floor: 0,
  floorAlt: 1,
  wallTop: 2,
  wallFace: 3,
  dais: 4,
  rug: 5,
};
export const HALL_WALKABLE = new Set([H.floor, H.floorAlt, H.dais, H.rug]);

// The doorway in the south wall, inclusive columns, and the first row of
// that wall (it runs to the bottom of the hall).
export const DOOR = { left: 13, right: 16 };
export const SOUTH_WALL = HALL_ROWS - 4;

const wx = (px) => HALL.x + px;
const wy = (py) => HALL.y + py;
const center = HALL.x + HALL.w / 2; // the hall's middle line

export function buildHallGrid() {
  const grid = [];
  for (let r = 0; r < HALL_ROWS; r += 1) {
    const row = [];
    for (let c = 0; c < HALL_COLS; c += 1) {
      let t = (c + r) % 2 === 0 ? H.floor : H.floorAlt;
      // A woven runner from the doors to the hearth.
      if (c >= 13 && c <= 16 && r >= 13 && r < SOUTH_WALL) t = H.rug;
      // The dais under the throne.
      if (c >= 11 && c <= 18 && r >= 3 && r <= 5) t = H.dais;
      if (r <= 1) t = H.wallTop;
      else if (r === 2) t = H.wallFace;
      if (c === 0 || c === HALL_COLS - 1) t = H.wallTop;
      // The south wall is four tiles deep, so the 64px doors stand inside it.
      if (r >= SOUTH_WALL) t = H.wallTop;
      row.push(t);
    }
    grid.push(row);
  }
  return grid;
}

// Props: texture key, frame, picture bottom (baseY), and the solid
// footprint (bodyW x bodyH, sitting on baseY - insetBottom).
function prop(key, x, baseY, bodyW, bodyH, extra = {}) {
  return { key, x: wx(x), baseY: wy(baseY), bodyW, bodyH, insetBottom: 2, ...extra };
}

export const HALL_PROPS = [
  prop('palace-throne', HALL.w / 2, 92, 40, 16),
  prop('palace-hearth', HALL.w / 2, 192, 44, 22, { frames: 4, fps: 6, glow: true }),
  prop('palace-column', 168, 136, 16, 10),
  prop('palace-column', 312, 136, 16, 10),
  prop('palace-column', 168, 252, 16, 10),
  prop('palace-column', 312, 252, 16, 10),
  prop('palace-banquet', 72, 152, 56, 20),
  prop('palace-banquet', 72, 264, 56, 20),
  prop('palace-banquet', 408, 152, 56, 20),
  prop('palace-banquet', 408, 264, 56, 20),
  prop('palace-loom', 436, 84, 28, 14, { frames: 2, fps: 1 }),
  prop('palace-bow-rack', 44, 84, 26, 12),
  prop('palace-amphora', 196, 284, 16, 10),
  prop('palace-amphora', 284, 284, 16, 10),
];

// Braziers on the walls: animated flames with a warm glow.
export const HALL_BRAZIERS = [
  { x: wx(116), baseY: wy(68) },
  { x: wx(364), baseY: wy(68) },
  { x: wx(28), baseY: wy(208) },
  { x: wx(452), baseY: wy(208) },
];

// The suitors feasting, and their hound. Sheet rows: S, SW, W, NW, N, NE, E, SE.
// Twelve suitors: outfits a, b, c (chiton and cloak, long robe, sleeveless
// with a cloak) in four colors each (crimson, royal blue, purple, sea green).
// The three named ones keep their old spots and Press E lines (HALL_SPOTS).
// The rest crowd the far side of each banquet table, facing the room.
export const HALL_PEOPLE = [
  { id: 'antinous', key: 'suitor-a-1', x: wx(118), y: wy(170), row: 6 },
  { id: 'eurymachus', key: 'suitor-b-2', x: wx(362), y: wy(170), row: 2 },
  { id: 'amphinomus', key: 'suitor-c-4', x: wx(362), y: wy(282), row: 2 },
  // Behind the north-west table.
  { id: 'suitor-1', key: 'suitor-b-3', x: wx(56), y: wy(124), row: 0 },
  { id: 'suitor-2', key: 'suitor-c-1', x: wx(90), y: wy(122), row: 1 },
  // Behind the north-east table.
  { id: 'suitor-3', key: 'suitor-a-2', x: wx(390), y: wy(122), row: 7 },
  { id: 'suitor-4', key: 'suitor-c-3', x: wx(424), y: wy(124), row: 0 },
  // Behind the south-west table.
  { id: 'suitor-5', key: 'suitor-a-4', x: wx(56), y: wy(236), row: 7 },
  { id: 'suitor-6', key: 'suitor-b-1', x: wx(90), y: wy(234), row: 0 },
  // Behind the south-east table.
  { id: 'suitor-7', key: 'suitor-c-2', x: wx(390), y: wy(234), row: 0 },
  { id: 'suitor-8', key: 'suitor-b-4', x: wx(424), y: wy(236), row: 1 },
  // At the outer end of the north-east table, by the wall.
  { id: 'suitor-9', key: 'suitor-a-3', x: wx(450), y: wy(152), row: 2 },
  { id: 'hound', key: 'suitors-hound', x: wx(122), y: wy(290), row: 6 },
];

// Odysseus steps in here, just inside the doors.
export const HALL_SPAWN = { x: center, y: wy(SOUTH_WALL * TILE - 36) };

export const HALL_SPOTS = [
  {
    id: 'hall-exit',
    x: center,
    y: wy(SOUTH_WALL * TILE - 8),
    radius: 22,
    who: 'The hall doors',
    line: 'Leave the hall for the courtyard.',
  },
  {
    id: 'throne',
    x: center,
    y: wy(112),
    radius: 30,
    who: 'The throne',
    line: 'Your own seat. Antinous has been sprawling in it all evening.',
  },
  {
    id: 'hearth',
    x: center,
    y: wy(218),
    radius: 34,
    who: 'The hearth',
    line: 'The fire at the heart of the hall. Your father lit it; you will not let it go cold.',
  },
  {
    id: 'bow',
    x: wx(44),
    y: wy(104),
    radius: 30,
    who: 'The great bow',
    line: 'The great bow of Odysseus. Not one of the suitors has been strong enough to string it.',
  },
  {
    id: 'loom',
    x: wx(436),
    y: wy(104),
    radius: 30,
    who: "Penelope's loom",
    line: 'By day Penelope weaves a shroud here; by night she unpicks it, so the suitors keep waiting.',
  },
  {
    id: 'antinous',
    x: wx(140),
    y: wy(178),
    radius: 26,
    who: 'Antinous',
    line: '"Another beggar! Sit by the door, old man, and be grateful for the scraps."',
  },
  {
    id: 'eurymachus',
    x: wx(340),
    y: wy(178),
    radius: 26,
    who: 'Eurymachus',
    line: '"Penelope will choose one of us soon. Her husband is twenty years dead."',
  },
  {
    id: 'amphinomus',
    x: wx(340),
    y: wy(290),
    radius: 26,
    who: 'Amphinomus',
    line: '"Leave the old man be, friends. Who knows what the gods have in store?"',
  },
];

// Every solid in the hall, as world-pixel rectangles.
export function hallSolids(grid = buildHallGrid(), { people = true } = {}) {
  const rects = [];
  for (let r = 0; r < HALL_ROWS; r += 1) {
    let start = -1;
    for (let c = 0; c <= HALL_COLS; c += 1) {
      const solid = c < HALL_COLS && !HALL_WALKABLE.has(grid[r][c]);
      if (solid && start < 0) start = c;
      if (!solid && start >= 0) {
        rects.push({ x: wx(start * TILE), y: wy(r * TILE), w: (c - start) * TILE, h: TILE });
        start = -1;
      }
    }
  }
  for (const p of HALL_PROPS) {
    const bottom = p.baseY - p.insetBottom;
    rects.push({ x: p.x - p.bodyW / 2, y: bottom - p.bodyH, w: p.bodyW, h: p.bodyH });
  }
  for (const b of HALL_BRAZIERS) rects.push({ x: b.x - 7, y: b.baseY - 8, w: 14, h: 8 });
  if (people) for (const person of HALL_PEOPLE) rects.push(personRect(person));
  return rects;
}

export function personRect(person) {
  return { x: person.x - 8, y: person.y - 10, w: 16, h: 10 };
}

// Can a feet-sized box walk from the spawn to every spot?
export function hallLayoutReport() {
  const rects = hallSolids();
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const standable = (x, y) => {
    if (x < HALL.x + FEET.w / 2 || x > HALL.x + HALL.w - FEET.w / 2) return false;
    if (y < HALL.y + FEET.h / 2 || y > HALL.y + HALL.h - FEET.h / 2) return false;
    const box = { x: x - FEET.w / 2, y: y - FEET.h / 2, w: FEET.w, h: FEET.h };
    return !rects.some((r) => overlaps(box, r));
  };
  const step = 4;
  const seen = new Set();
  const key = (x, y) => `${x},${y}`;
  const problems = [];
  if (!standable(HALL_SPAWN.x, HALL_SPAWN.y)) problems.push('Hall spawn is inside something solid.');
  const queue = [[HALL_SPAWN.x, HALL_SPAWN.y]];
  seen.add(key(HALL_SPAWN.x, HALL_SPAWN.y));
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (seen.has(key(nx, ny)) || !standable(nx, ny)) continue;
      seen.add(key(nx, ny));
      queue.push([nx, ny]);
    }
  }
  for (const spot of HALL_SPOTS) {
    let ok = false;
    for (const k of seen) {
      const [x, y] = k.split(',').map(Number);
      if (Math.hypot(x - spot.x, y - spot.y) <= spot.radius - 4) { ok = true; break; }
    }
    if (!ok) problems.push(`Cannot reach "${spot.id}" in the hall.`);
  }
  return { ok: problems.length === 0, problems, reachable: seen.size };
}
