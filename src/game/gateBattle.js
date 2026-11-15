// The battle inside the gate, after the doors fall.
//
// 1. The Greek army runs up the beach road and in THROUGH the open gate,
//    two abreast, then each man peels off toward his own duel spot.
// 2. At the same time, Trojans run down from the city to meet them.
// 3. Each Greek and his Trojan fight forever: one thrusts, the other flashes
//    red and is pushed back a step, then they trade again.
//
// These duels are only scenery. They have no physics bodies, no Press E, and
// do not count toward the objective. The Trojans the player must beat are the
// separate city groups (spawnCityGroups in TroyScene.js), which nobody fights.

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
// Red flash for the man who is hit. tintFill paints only his own pixels.
const HURT_RED = 0xe03a2a;

function addSoldier(scene, team, x, y, texture) {
  const shadow = scene.add.ellipse(x + 3, y + 1, 14, 5, 0x0c1424, 0.5);
  const sprite = scene.add.sprite(x, y, texture, 0).setOrigin(0.5, 1);
  const man = { team, sprite, shadow, facing: 's' };
  sortDepth(man);
  return man;
}

// Things lower on screen draw in front, like everything else in Troy.
function sortDepth(man) {
  const depth = 7600 + man.sprite.y;
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
  pair.ready += 1;
  if (pair.ready === 2) startDuel(scene, pair);
}

// Call once, when the gate falls. Returns the pairs so the scene can find them.
export function startGateBattle(scene) {
  for (const key of ['greek-hoplite', 'trojan-soldier']) {
    const tex = scene.textures.get(key);
    if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
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
    const greek = addSoldier(scene, 'greek', GATE_X + lane, 690 + rank * 12, 'greek-hoplite');
    // Trojans start deeper in the city, straight up from their spot.
    const trojan = addSoldier(scene, 'trojan', trojanX, spot.y - 150, 'trojan-soldier');

    const pair = { greek, trojan, ready: 0 };
    // Up the middle of the gate, then off to the duel spot.
    runPath(scene, greek, [
      { x: GATE_X + lane, y: INSIDE_Y },
      { x: greekX, y: spot.y },
    ], 700 + rank * 160, () => arrive(scene, pair, greek, greekFacing));
    runPath(scene, trojan, [{ x: trojanX, y: spot.y }], 500 + index * 40,
      () => arrive(scene, pair, trojan, trojanFacing));
    return pair;
  });
  scene.gateBattle = pairs;
  return pairs;
}
