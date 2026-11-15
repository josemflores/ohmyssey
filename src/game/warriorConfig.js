// How the two armies are drawn.
//
// Frame order matches Odysseus: south, south-east, east, north-east,
// north, north-west, west, south-west. One frame each, left to right.
//
// Jose is making real PixelLab sheets. When a png is ready:
//   1. Put it in public/assets/sprites/.
//   2. Set that team's `path` below. Leave path null to keep the stand-in.
//   3. If the sheet also has walk frames, set `walk`. Walk frames come AFTER
//      the idle eight, one row of eight per step, same facing order.
//      Example: 2 steps → 24 frames, idle on row 0.

export const WARRIOR_CONFIG = {
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
  // null = idle frames only. { framesPerFacing, frameRate } turns on the walk.
  walk: null,
  teams: {
    greek: { key: 'warrior-greek', path: null },
    trojan: { key: 'warrior-trojan', path: null },
  },
};

// stepping is true while the warrior is moving and walk frames exist.
export function warriorFrame(facing, stepping, stepIndex) {
  const idle = WARRIOR_CONFIG.facingFrames[facing] ?? 0;
  const walk = WARRIOR_CONFIG.walk;
  if (!stepping || !walk) return idle;
  const step = stepIndex % walk.framesPerFacing;
  const perRow = Object.keys(WARRIOR_CONFIG.facingFrames).length;
  return (1 + step) * perRow + idle;
}
