// How Odysseus is drawn.
//
// Both sheets are 32×32 frames, origin bottom-center, built by
// art/scripts/build_odysseus_lpc.py from Universal LPC layers.
//
// Idle: eight frames, one per facing, in facingFrames order.
// Walk: a strip grouped by that same order (s, se, e, ne, n, nw, w, sw).
// LPC only has four directions, so the diagonals reuse the side rows:
// se/ne use east, sw/nw use west. Eight stepping frames per facing
// (LPC walk frames 1–8; frame 0 is the idle stand).

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
  walk: {
    path: '/assets/sprites/odysseus_walk.png',
    frameWidth: 32,
    frameHeight: 32,
    framesPerFacing: 8,
    frameRate: 10,
  },
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
