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
// 4. A squad of Greeks with torches runs to houses near the gate. Each one
//    stops at a door, and a moment later that house goes up in flames
//    (burning.js). They stay there, guarding the fire.
//
// Nobody appears out of thin air: the Greeks come along the beach from off
// screen, and each Trojan starts out of view on a line that is checked
// against the walls, houses, trees and lamps before he runs it.

import Phaser from 'phaser';
import { soldierAnim, soldierWalk, facingToward, addBreathing } from './soldierAnimations.js';
import { MAP_H, MAP_W, PROPS } from './map.js';
import { addTorch, igniteHouse } from './burning.js';

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
const RUN_SPEED = 150;
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

// Keep the shadow (and torch, if he has one) with him while a tween moves him.
function follow(man) {
  if (!man.sprite.active) return;
  man.shadow.setPosition(man.sprite.x + 3, man.sprite.y + 1);
  sortDepth(man);
  if (man.torch) man.torch.follow();
}

function playWalk(man, facing) {
  if (!man.sprite.active) return;
  man.facing = facing;
  const key = soldierWalk(man.team, facing);
  if (man.sprite.scene.anims.exists(key)) man.sprite.play(key, true);
}

function playIdle(man) {
  if (!man.sprite.active) return;
  const key = soldierAnim(man.team, 'idle', man.facing);
  if (man.sprite.scene.anims.exists(key)) man.sprite.play(key, true);
  addBreathing(man.sprite);
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
    // He may have boarded the ship (and been removed) before his turn came.
    if (!man.sprite.active || man.boarded) return;
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
    if (scene.duelsOver) return;
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
  standSolid(scene, man);
  pair.ready += 1;
  if (pair.ready === 2) startDuel(scene, pair);
}

// A solid footprint at his feet (the lean in a thrust is only 3px), so
// Odysseus walks around him.
function standSolid(scene, man) {
  if (!scene.soldierBlockers) return;
  const block = scene.soldierBlockers.create(man.sprite.x, man.sprite.y - 6, 'blank');
  block.setDisplaySize(18, 12);
  block.refreshBody();
  block.setVisible(false);
  man.blocker = block;
}

// Houses near the gate that the torch-bearers set alight, by their map
// position (see PROPS in map.js). Each one gets its own Greek.
const BURN_HOUSES = [
  { x: 200, baseY: 520 },
  { x: 800, baseY: 500 },
  { x: 840, baseY: 560 },
  { x: 700, baseY: 400 },
  { x: 140, baseY: 340 },
  { x: 640, baseY: 300 },
];

// Where the door is on each house picture, from its center: the 'house'
// door is right of center, the 'houseAlt' door is in the middle.
const DOOR_OFFSET = { house: 9, houseAlt: 0 };

// Send the torch-bearers. They start on the beach right behind the duelists,
// run in through the gate, stop at their door, and the house catches fire.
function sendTorchBearers(scene, westX, eastX, avoid) {
  let lastMs = 0;
  scene.torchBearers = [];
  BURN_HOUSES.forEach((target, index) => {
    const prop = PROPS.find((p) => p.x === target.x && p.baseY === target.baseY);
    if (!prop) return;
    const west = prop.x < GATE_X;
    const lane = west ? -10 : 10;
    const door = { x: prop.x + (DOOR_OFFSET[prop.id] || 0), y: prop.baseY + 12 };
    // Along the wet sand south of the oak, in through the gate, then a route
    // on open ground to his door: around houses, trees, lamps and the
    // duelists' spots, never through them.
    const startAt = { x: west ? westX : eastX, y: 730 + (index % 2) * 13 };
    const man = addSoldier(scene, 'greek', startAt.x, startAt.y, 'greek-hoplite');
    man.torch = addTorch(scene, man);
    const gateIn = { x: GATE_X + lane, y: INSIDE_Y };
    const beach = [{ x: GATE_X + lane, y: startAt.y }, gateIn];
    const onward = routePath(avoid, gateIn, door);
    let path = onward ? [...beach, ...onward] : [...beach, { x: GATE_X + lane, y: door.y }, door];
    if (!pathClear(avoid, startAt, beach)) {
      man.sprite.setPosition(GATE_X + lane, startAt.y);
      path = path.slice(1);
    }
    const delay = 500 + index * 150;
    runPath(scene, man, path, delay, () => {
      man.facing = 'n';
      playIdle(man);
      standSolid(scene, man);
      // A beat at the door, then the torch goes in and the roof catches.
      scene.time.delayedCall(450, () => {
        if (man.torch) man.torch.drop();
        man.torch = null;
        igniteHouse(scene, prop);
        // Step back and watch it burn, facing the street.
        man.facing = 's';
        playIdle(man);
      });
    });
    lastMs = Math.max(lastMs, delay + pathMs(man.sprite, path));
    scene.torchBearers.push(man);
  });
  return lastMs;
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

// A route on open ground from `from` to `to`, for men whose way is not a
// straight line (the torch-bearers). Breadth-first search over an 8px grid
// of the map, where a cell is open when a feet-sized box there touches
// nothing solid; then the zig-zag is pulled tight into a few straight legs.
// Returns the points to walk (not including `from`), or null.
const GRID = 8;
function routePath(boxes, from, to) {
  const cols = Math.floor(MAP_W / GRID);
  const rows = Math.floor(MAP_H / GRID);
  const open = (c, r) => {
    if (c < 1 || r < 1 || c >= cols - 1 || r >= rows - 1) return false;
    const a = feetBox(c * GRID, r * GRID);
    return !boxes.some((b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
  };
  const sc = Math.round(from.x / GRID);
  const sr = Math.round(from.y / GRID);
  const tc = Math.round(to.x / GRID);
  const tr = Math.round(to.y / GRID);
  const prev = new Int32Array(cols * rows).fill(-1);
  const start = sr * cols + sc;
  prev[start] = start;
  const queue = [start];
  let found = -1;
  for (let head = 0; head < queue.length; head += 1) {
    const key = queue[head];
    const c = key % cols;
    const r = (key - c) / cols;
    if (Math.abs(c - tc) <= 1 && Math.abs(r - tr) <= 1) { found = key; break; }
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      const nk = nr * cols + nc;
      if (prev[nk] !== -1 || !open(nc, nr)) continue;
      prev[nk] = key;
      queue.push(nk);
    }
  }
  if (found < 0) return null;
  const cells = [];
  for (let k = found; k !== start; k = prev[k]) cells.push({ x: (k % cols) * GRID, y: Math.floor(k / cols) * GRID });
  cells.reverse();
  if (lineClear(boxes, cells[cells.length - 1] || from, to)) cells.push(to);
  // Pull tight: from each point, jump to the farthest point still in plain view.
  const legs = [];
  let at = from;
  let i = 0;
  while (i < cells.length) {
    let j = cells.length - 1;
    while (j > i && !lineClear(boxes, at, cells[j])) j -= 1;
    legs.push(cells[j]);
    at = cells[j];
    i = j + 1;
  }
  return legs;
}

function pathClear(boxes, from, points) {
  let at = from;
  for (const to of points) {
    if (!lineClear(boxes, at, to)) return false;
    at = to;
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
    // Along the wet sand, south of the oak outside the gate (map.js), then
    // north up the road. Each leg is checked against everything solid.
    const beachY = 730 + (rank % 3) * 13;
    const greek = addSoldier(scene, 'greek', beachX, beachY, 'greek-hoplite');
    const tSpot = { x: trojanX, y: spot.y };
    const tFrom = trojanStart(boxes, tSpot, viewTop);
    const trojan = addSoldier(scene, 'trojan', tFrom.x, tFrom.y, 'trojan-soldier');

    const pair = { greek, trojan, ready: 0 };
    // Along the beach to the road, up the middle of the gate, then off to
    // the duel spot.
    let greekPath = [
      { x: GATE_X + lane, y: beachY },
      { x: GATE_X + lane, y: INSIDE_Y },
      { x: greekX, y: spot.y },
    ];
    if (!pathClear(boxes, { x: beachX, y: beachY }, greekPath)) {
      // Something new is in the way on the beach: start him on the road
      // itself, out of view to the south, and fade him in. Never through it.
      greek.sprite.setPosition(GATE_X + lane, beachY);
      greekPath = greekPath.slice(1);
    }
    const greekDelay = 150 + rank * 130;
    runPath(scene, greek, greekPath, greekDelay, () => arrive(scene, pair, greek, greekFacing));
    const trojanDelay = 150 + index * 30;
    runPath(scene, trojan, [tSpot], trojanDelay, () => arrive(scene, pair, trojan, trojanFacing));
    lastMs = Math.max(
      lastMs,
      greekDelay + pathMs(greek.sprite, greekPath),
      trojanDelay + pathMs(trojan.sprite, [tSpot]),
    );
    return pair;
  });
  // The torch-bearers follow the duelists in. The camera does not wait for
  // them (they run deep into the city), so their time is not in lastMs.
  // Every duelist's spot counts as solid for their route.
  const duelBoxes = DUEL_SPOTS.flatMap((spot) => [-HALF_GAP, HALF_GAP].map((dx) => ({
    x: spot.x + dx - 11, y: spot.y - 14, w: 22, h: 16,
  })));
  sendTorchBearers(scene, westX, eastX, [...boxes, ...duelBoxes]);
  scene.gateBattle = pairs;
  scene.gateBattleMs = lastMs;
  return pairs;
}

// ---------------------------------------------------------------------------
// Victory. Once Odysseus has beaten every Trojan group, the duels end: each
// Trojan breaks and runs back into the city, and every Greek (duelists and
// torch-bearers) falls back through the gate to the beach, forming up on
// either side of the ship with the road to it left open for Odysseus.
// ---------------------------------------------------------------------------

// Rows on the beach, west and east of the road to the ship (x 437 to 523
// stays clear for Odysseus). Any spot touching something solid is skipped.
function beachSpots(boxes) {
  const spots = [];
  for (const y of [708, 730, 752, 774]) {
    for (const x of [428, 532, 404, 556, 380, 580, 356, 604]) spots.push({ x, y });
  }
  return spots.filter((spot) => {
    const a = feetBox(spot.x, spot.y);
    return !boxes.some((b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
  });
}

function dropSolid(man) {
  if (man.blocker) {
    man.blocker.destroy();
    man.blocker = null;
  }
}

export function endGateBattle(scene) {
  if (scene.duelsOver) return;
  scene.duelsOver = true;
  const pairs = scene.gateBattle || [];
  const boxes = solidBoxes(scene);

  // The Trojans break: a red flash, then they run north and are gone.
  pairs.forEach((pair, index) => {
    const man = pair.trojan;
    if (!man.sprite.active) return;
    dropSolid(man);
    scene.time.delayedCall(index * 60, () => {
      man.sprite.setTintFill(HURT_RED);
      scene.time.delayedCall(140, () => man.sprite.active && man.sprite.clearTint());
      const away = { x: man.sprite.x, y: man.sprite.y - 70 };
      const clear = lineClear(boxes, { x: man.sprite.x, y: man.sprite.y }, away);
      if (clear) runPath(scene, man, [away], 160, () => {});
      scene.tweens.add({
        targets: [man.sprite, man.shadow],
        alpha: 0,
        delay: clear ? 260 : 160,
        duration: 420,
        onComplete: () => {
          man.sprite.destroy();
          man.shadow.destroy();
        },
      });
    });
  });

  // The Greeks fall back to the ship, nearest to the gate first.
  const greeks = [
    ...pairs.map((pair) => pair.greek),
    ...(scene.torchBearers || []),
  ].filter((man) => man.sprite.active);
  greeks.sort((a, b) => b.sprite.y - a.sprite.y);
  const spots = beachSpots(boxes);
  scene.retreatingGreeks = [];
  greeks.forEach((man, index) => {
    const spot = spots[index];
    if (!spot) return;
    dropSolid(man);
    if (man.torch) {
      man.torch.drop();
      man.torch = null;
    }
    const from = { x: man.sprite.x, y: man.sprite.y };
    const route = routePath(boxes, from, spot) || [spot];
    scene.retreatingGreeks.push(man);
    runPath(scene, man, route, 300 + index * 110, () => {
      if (!man.sprite.active || man.boarded) return;
      // Face the sea and the ship, and stand solid on the sand.
      man.facing = 's';
      playIdle(man);
      standSolid(scene, man);
      man.atShip = true;
    });
  });
}

// Odysseus has reached the ship: his men climb aboard after him.
// Calls done once the last one is on the ship.
export function boardShip(scene, ship, done) {
  const men = (scene.retreatingGreeks || []).filter((man) => man.sprite.active);
  if (!men.length) {
    done();
    return;
  }
  let left = men.length;
  men.forEach((man, index) => {
    man.boarded = true;
    dropSolid(man);
    scene.tweens.killTweensOf(man.sprite);
    playWalk(man, facingToward(ship.x - man.sprite.x, ship.y - man.sprite.y));
    scene.tweens.add({
      targets: man.sprite,
      x: ship.x + ((index % 5) - 2) * 10,
      y: ship.y,
      alpha: 0,
      delay: index * 45,
      duration: 520,
      ease: 'Sine.easeIn',
      onUpdate: () => follow(man),
      onComplete: () => {
        man.sprite.destroy();
        man.shadow.destroy();
        left -= 1;
        if (left === 0) done();
      },
    });
    scene.tweens.add({ targets: man.shadow, alpha: 0, delay: index * 45, duration: 520 });
  });
}
