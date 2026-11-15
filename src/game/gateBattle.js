// The battle inside the gate, after the doors fall.
//
// 1. The Greek army runs up the beach road and in THROUGH the open gate,
//    two abreast, then each man peels off toward his own duel spot.
// 2. At the same time, Trojans run down from the city to meet them.
// 3. Each Greek and his Trojan fight forever: one thrusts, the other flashes
//    red and is pushed back a step, then they trade again.
//
// These duels are scenery: no Press E, and they do not count toward the
// objective. The Trojans the player must beat are the separate city groups
// (spawnCityGroups in TroyScene.js), which nobody fights. Each duelist does get
// a solid footprint once he reaches his spot, so Odysseus walks around the
// fighting, not through it.
//
// Nobody appears out of thin air: the Greeks come along the beach from off
// screen, and each Trojan starts out of view on a line that is checked
// against the walls, houses, trees and lamps before he runs it.

import Phaser from 'phaser';
import { soldierAnim, soldierWalk, facingToward } from './soldierAnimations.js';

// Where each pair fights: on the two flanks just inside the wall, leaving the
// road up the middle open for Odysseus. Checked against the house footprints.
// The Greek stands on the gate side of each pair, the Trojan on the city side.
const DUEL_SPOTS = [
  // West flank
  { x: 300, y: 420 },
  { x: 370, y: 436 },
  { x: 296, y: 470 },
  { x: 366, y: 490 },
  { x: 302, y: 526 },
  { x: 372, y: 546 },
  { x: 334, y: 572 },
  // East flank
  { x: 660, y: 420 },
  { x: 590, y: 436 },
  { x: 664, y: 470 },
  { x: 594, y: 490 },
  { x: 658, y: 526 },
  { x: 588, y: 546 },
  { x: 626, y: 572 },
];

// The first seven spots are on the west flank.
const WEST_COUNT = 7;

// Gap between the two fighters of a pair, in pixels.
const HALF_GAP = 11;
// Running speed in pixels per second (Odysseus walks at 80).
const RUN_SPEED = 120;
// The gate opening is x 416 to 544. The column runs up its middle.
const GATE_X = 480;
// A point just inside the wall, where the column turns off toward the duels.
const INSIDE_Y = 566;
// Where the camera looks while the gate falls (TroyScene playGateFall).
export const GATE_VIEW_Y = 600;
// Red flash for the man who is hit. tintFill paints only his own pixels.
const HURT_RED = 0xe03a2a;

function addSoldier(scene, team, x, y, texture) {
  const shadow = scene.add.ellipse(x + 3, y + 1, 14, 5, 0x0c1424, 0.5).setAlpha(0);
  const sprite = scene.add.sprite(x, y, texture, 0).setOrigin(0.5, 1).setAlpha(0);
  const man = { team, sprite, shadow, facing: 's' };
  sortDepth(man);
  return man;
}

// Things lower on screen draw in front, like everything else in Troy
// (Odysseus, houses and props all use 7000 + y).
function sortDepth(man) {
  const depth = 7000 + man.sprite.y;
  man.shadow.setDepth(depth - 2);
  man.sprite.setDepth(depth);
}

// Keep the shadow under his feet while a tween moves him.
function follow(man) {
  man.shadow.setPosition(man.sprite.x + 3, man.sprite.y + 1);
  sortDepth(man);
}

function playWalk(man, facing) {
  man.facing = facing;
  const key = soldierWalk(man.team, facing);
  if (man.sprite.scene.anims.exists(key)) man.sprite.play(key, true);
}

function playIdle(man) {
  const key = soldierAnim(man.team, 'idle', man.facing);
  if (man.sprite.scene.anims.exists(key)) man.sprite.play(key, true);
}

function pathMs(sprite, points) {
  let from = { x: sprite.x, y: sprite.y };
  let total = 0;
  for (const to of points) {
    total += Math.max(60, (Math.hypot(to.x - from.x, to.y - from.y) / RUN_SPEED) * 1000);
    from = to;
  }
  return total;
}

// Run through a list of points, one straight leg at a time, then call done.
function runPath(scene, man, points, delay, done) {
  const legs = [];
  let from = { x: man.sprite.x, y: man.sprite.y };
  for (const to of points) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const facing = facingToward(dx, dy);
    legs.push({
      targets: man.sprite,
      x: to.x,
      y: to.y,
      duration: Math.max(60, (Math.hypot(dx, dy) / RUN_SPEED) * 1000),
      onStart: () => playWalk(man, facing),
      onUpdate: () => follow(man),
    });
    from = to;
  }
  scene.time.delayedCall(delay, () => {
    // Fade in over the first steps (they start out of view anyway).
    scene.tweens.add({ targets: man.sprite, alpha: 1, duration: 250 });
    scene.tweens.add({ targets: man.shadow, alpha: 0.5, duration: 250 });
    scene.tweens.chain({ tweens: legs, onComplete: done });
  });
}

// One exchange: the attacker thrusts, the defender flashes red and gives a
// step, then both settle back into their stance.
function exchange(scene, attacker, defender) {
  if (!attacker.sprite.active || !defender.sprite.active) return;
  const thrust = soldierAnim(attacker.team, 'attack', attacker.facing);
  if (scene.anims.exists(thrust)) attacker.sprite.play(thrust);
  const toward = Math.sign(defender.sprite.x - attacker.sprite.x) || 1;
  // Lean into the thrust.
  scene.tweens.add({
    targets: attacker.sprite,
    x: attacker.sprite.x + toward * 3,
    duration: 180,
    yoyo: true,
    onUpdate: () => follow(attacker),
  });
  // The spear lands about a third of the way through the thrust.
  scene.time.delayedCall(220, () => {
    if (!defender.sprite.active) return;
    defender.sprite.setTintFill(HURT_RED);
    scene.time.delayedCall(130, () => defender.sprite.active && defender.sprite.clearTint());
    scene.tweens.add({
      targets: defender.sprite,
      x: defender.sprite.x + toward * 3,
      duration: 140,
      yoyo: true,
      onUpdate: () => follow(defender),
    });
  });
  scene.time.delayedCall(620, () => {
    if (attacker.sprite.active) playIdle(attacker);
  });
}

// Keep a pair fighting: pick who strikes, wait a moment, repeat.
function startDuel(scene, pair) {
  const next = () => {
    if (!pair.greek.sprite.active || !pair.trojan.sprite.active) return;
    // The Greeks win a little more often. It is their night.
    const greekStrikes = Math.random() < 0.6;
    const [attacker, defender] = greekStrikes ? [pair.greek, pair.trojan] : [pair.trojan, pair.greek];
    exchange(scene, attacker, defender);
    scene.time.delayedCall(Phaser.Math.Between(900, 1700), next);
  };
  // Start the pairs out of step with each other so the field looks busy.
  scene.time.delayedCall(Phaser.Math.Between(100, 900), next);
}

// Both fighters of a pair have to be in place before the duel starts.
function arrive(scene, pair, man, facing) {
  man.facing = facing;
  playIdle(man);
  // A solid footprint at his feet (the lean in a thrust is only 3px).
  if (scene.soldierBlockers) {
    const block = scene.soldierBlockers.create(man.sprite.x, man.sprite.y - 6, 'blank');
    block.setDisplaySize(18, 12);
    block.refreshBody();
    block.setVisible(false);
    man.blocker = block;
  }
  pair.ready += 1;
  if (pair.ready === 2) startDuel(scene, pair);
}

// Feet-sized box, the same size the footprints use.
function feetBox(x, y) {
  return { x: x - 7, y: y - 10, w: 14, h: 10 };
}

function solidBoxes(scene) {
  return scene.blockers.getChildren()
    .filter((block) => block.active && block.body)
    .map((block) => ({ x: block.body.x, y: block.body.y, w: block.body.width, h: block.body.height }));
}

function lineClear(boxes, from, to) {
  const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 3);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / Math.max(1, steps);
    const a = feetBox(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
    if (boxes.some((r) => a.x < r.x + r.w && a.x + a.w > r.x && a.y < r.y + r.h && a.y + a.h > r.y)) return false;
  }
  return true;
}

// A start for a Trojan: out of the camera's view, on a straight run to his
// spot that touches nothing solid. Tries straight up first, then nearby.
function trojanStart(boxes, spot, viewTop) {
  const tries = [];
  for (const up of [150, 130, 170, 110, 190]) {
    for (const side of [0, -24, 24, -48, 48, -72, 72]) tries.push({ x: spot.x + side, y: spot.y - up });
  }
  for (const from of tries) {
    if (from.y > viewTop - 24) continue;
    if (lineClear(boxes, from, spot)) return from;
  }
  // Nothing clear: start him on his spot, faded in, rather than through a wall.
  return { x: spot.x, y: spot.y };
}

// Call once, when the gate falls. Returns the pairs so the scene can find them.
// scene.gateBattleMs is how long until the last man reaches his spot.
export function startGateBattle(scene) {
  for (const key of ['greek-hoplite', 'trojan-soldier']) {
    const tex = scene.textures.get(key);
    if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  const boxes = solidBoxes(scene);
  // The camera is panning to the gate; work out what it will show there.
  const cam = scene.cameras.main;
  const halfW = cam.width / (2 * cam.zoom);
  const halfH = cam.height / (2 * cam.zoom);
  const viewTop = GATE_VIEW_Y - halfH;
  // The braziers on the beach stand at x 200 and 760.
  const westX = Phaser.Math.Clamp(GATE_X - halfW - 24, 232, 728);
  const eastX = Phaser.Math.Clamp(GATE_X + halfW + 24, 232, 728);
  let lastMs = 0;
  const pairs = DUEL_SPOTS.map((spot, index) => {
    const west = spot.x < GATE_X;
    // The Greek takes the side nearer the road, so he faces out toward the
    // houses and the Trojan faces back toward the road.
    const greekX = west ? spot.x + HALF_GAP : spot.x - HALF_GAP;
    const trojanX = west ? spot.x - HALF_GAP : spot.x + HALF_GAP;
    const greekFacing = west ? 'w' : 'e';
    const trojanFacing = west ? 'e' : 'w';

    // Greeks line up on the beach road, two abreast, outside the gate.
    // The left file goes to the west flank, the right file to the east, so
    // the two files never cross once they are through the gate.
    const lane = west ? -10 : 10;
    const rank = west ? index : index - WEST_COUNT;
    // Each file comes along the beach from its own side, from out of view.
    const beachX = west ? westX : eastX;
    const greek = addSoldier(scene, 'greek', beachX, 704 + (rank % 3) * 16, 'greek-hoplite');
    const tSpot = { x: trojanX, y: spot.y };
    const tFrom = trojanStart(boxes, tSpot, viewTop);
    const trojan = addSoldier(scene, 'trojan', tFrom.x, tFrom.y, 'trojan-soldier');

    const pair = { greek, trojan, ready: 0 };
    // Along the beach to the road, up the middle of the gate, then off to
    // the duel spot.
    const greekPath = [
      { x: GATE_X + lane, y: 690 },
      { x: GATE_X + lane, y: INSIDE_Y },
      { x: greekX, y: spot.y },
    ];
    const greekDelay = 700 + rank * 240;
    runPath(scene, greek, greekPath, greekDelay, () => arrive(scene, pair, greek, greekFacing));
    const trojanDelay = 500 + index * 40;
    runPath(scene, trojan, [tSpot], trojanDelay, () => arrive(scene, pair, trojan, trojanFacing));
    lastMs = Math.max(
      lastMs,
      greekDelay + pathMs(greek.sprite, greekPath),
      trojanDelay + pathMs(trojan.sprite, [tSpot]),
    );
    return pair;
  });
  scene.gateBattle = pairs;
  scene.gateBattleMs = lastMs;
  return pairs;
}
