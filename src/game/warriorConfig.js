// How the two armies are drawn.
//
// Frame order matches Odysseus: south, south-east, east, north-east,
// north, north-west, west, south-west. One frame each, left to right.
// Both sheets are Universal LPC soldiers built by art/scripts/build_soldiers_lpc.py.
// Greeks wear bronze armor like Odysseus' with a dull maroon crest, so his
// dark iron and bright scarlet crest still stand out. Trojans wear dark gray armor.
// These sheets are idle only. The scene bobs a frame while a warrior moves.
// The breathing, spear-thrust, and hit animations are in soldierAnimations.js.
//
// Leave a team's path null to fall back to the drawn stand-in in warriorArt.js.
// A walk sheet, if one arrives later, adds rows AFTER the idle eight.
// One row of eight per step, same facing order.
// Example: 2 steps → 24 frames, idle on row 0.

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
    greek: { key: 'soldier-red-greek', path: '/assets/sprites/npcs/greek_lpc/greek_idle.png' },
    trojan: { key: 'soldier-teal-trojan', path: '/assets/sprites/npcs/trojan_lpc/trojan_idle.png' },
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
