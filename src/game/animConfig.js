// How Odysseus is drawn, and where a walk cycle will plug in later.
//
// The sheet we have is idle only: eight 32×32 frames, one per facing.
// There is no walk cycle yet. TroyScene bobs the idle frame while he moves.
//
// To drop in a real walk later:
//   1. Add the file under public/assets/sprites/.
//   2. Fill in `walk` below (it is null on purpose today).
//   3. Lay the frames out in a strip, grouped by facing, in the SAME order
//      as facingFrames: s, se, e, ne, n, nw, w, sw.
//      Example: 4 frames of south, then 4 of south-east, and so on.

export const ANIM_CONFIG = {
  textureKey: 'odysseus',
  path: '/assets/sprites/odysseus_idle.png',
  frameWidth: 32,
  frameHeight: 32,
  facingFrames: {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4,
    nw: 5,
    w: 6,
    sw: 7,
  },
  // null = no walk frames yet. Shape when you have them:
  // { path, frameWidth, frameHeight, framesPerFacing, frameRate }
  walk: null,
};

// Eight directions, used to pick a frame from a velocity.
const ORDER = [
  { name: 'e', x: 1, y: 0 },
  { name: 'se', x: 1, y: 1 },
  { name: 's', x: 0, y: 1 },
  { name: 'sw', x: -1, y: 1 },
  { name: 'w', x: -1, y: 0 },
  { name: 'nw', x: -1, y: -1 },
  { name: 'n', x: 0, y: -1 },
  { name: 'ne', x: 1, y: -1 },
];

// vx, vy point the way he WANTS to face (screen y grows downward).
export function facingFromVector(vx, vy) {
  const len = Math.hypot(vx, vy) || 1;
  const nx = vx / len;
  const ny = vy / len;
  let best = 's';
  let bestDot = -Infinity;
  for (const dir of ORDER) {
    const dl = Math.hypot(dir.x, dir.y);
    const dot = nx * (dir.x / dl) + ny * (dir.y / dl);
    if (dot > bestDot) {
      bestDot = dot;
      best = dir.name;
    }
  }
  return best;
}
