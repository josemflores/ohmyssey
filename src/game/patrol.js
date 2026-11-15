// Fight numbers, and the soldiers who enter after the gate opens.
//
// The road from the horse to the gate is empty. No Trojans, and no
// Greeks standing around. Pressing E on the doors calls createRelief:
// the army runs in from the beach, then the sentries appear in the streets.

import { facingFromVector } from './animConfig.js';
import { HATCH_QUESTIONS } from './hatchQuestions.js';
import { shuffleChoices } from '../learn/encounters/questions.js';
import { MAP_W } from './map.js';
import { WARRIOR_CONFIG } from './warriorConfig.js';

export const WALK_SPEED = 80;
export const RUN_SPEED = 136;

export const HERO_MAX = 30;
export const FOE_MAX = 12;
export const FULL_HIT = 6;
export const WEAK_HIT = 4.5;
export const FOE_HIT = 4;

// Away from the hatch: west, east, and north into the streets.
// createScatter is unused on this level. The army comes through the gate.
const SCATTER = [
  { ox: -28, oy: 8, goalX: -140, goalY: 200 },
  { ox: 28, oy: 10, goalX: MAP_W + 140, goalY: 180 },
  { ox: -8, oy: -6, goalX: 220, goalY: -140 },
];

export function createQuestions() {
  let index = 0;
  return {
    next() {
      const q = HATCH_QUESTIONS[index % HATCH_QUESTIONS.length];
      index += 1;
      return shuffleChoices({
        id: q.id,
        prompt: q.prompt,
        choices: q.choices.slice(),
        answer: q.answer,
      });
    },
  };
}

export function createScatter(scene, { ground, blockers, heroBody, fromHorse }) {
  const greeks = [];
  if (!fromHorse || scene.game.registry.get('greeksScattered')) {
    return {
      update() {},
      count() { return 0; },
    };
  }

  const greekKey = WARRIOR_CONFIG.teams.greek.key;
  const tex = scene.textures.get(greekKey);
  if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  scene.game.registry.set('greeksScattered', true);

  SCATTER.forEach((dir) => {
    const man = makeSoldier(
      scene,
      greekKey,
      fromHorse.x + dir.ox,
      fromHorse.y + dir.oy,
      'n',
      {
        kind: 'greek',
        goalX: dir.goalX,
        goalY: dir.goalY,
        side: 0,
        age: 0,
      },
    );
    scene.physics.add.collider(man.body, ground);
    scene.physics.add.collider(man.body, blockers);
    if (heroBody) scene.physics.add.collider(heroBody, man.body);
    greeks.push(man);
  });

  return {
    update(dt) {
      for (let i = greeks.length - 1; i >= 0; i -= 1) {
        const man = greeks[i];
        stepGreek(man, scene, dt);
        pose(man);
        if (man.gone) {
          retire(man);
          greeks.splice(i, 1);
        }
      }
    },
    count() {
      return greeks.length;
    },
  };
}

function stepGreek(man, scene, dt) {
  man.age += dt;
  const dx = man.goalX - man.body.x;
  const dy = man.goalY - man.body.y;
  let ang = Math.atan2(dy, dx);
  const blocked = man.body.body.blocked;
  const hit = blocked.up || blocked.down || blocked.left || blocked.right;
  if (hit) {
    if (!man.side) man.side = Math.random() < 0.5 ? 1 : -1;
    ang += man.side * 1.2;
  } else {
    man.side = 0;
  }
  const vx = Math.cos(ang);
  const vy = Math.sin(ang);
  man.body.setVelocity(vx * RUN_SPEED, vy * RUN_SPEED);
  man.facing = facingFromVector(vx, vy);
  if (man.age > 0.7 && isOffScreen(scene, man.body.x, man.body.y)) man.gone = true;
}

function isOffScreen(scene, x, y) {
  const view = scene.cameras.main.worldView;
  const pad = 40;
  return x < view.x - pad || y < view.y - pad || x > view.right + pad || y > view.bottom + pad;
}

function retire(man) {
  man.body.destroy();
  man.sprite.destroy();
  man.rim.destroy();
  man.shadow.destroy();
}

function pose(man) {
  const frame = WARRIOR_CONFIG.facingFrames[man.facing] ?? 0;
  const groundY = man.body.y + man.body.height / 2;
  const x = Math.round(man.body.x);
  const y = Math.round(groundY);
  man.sprite.setFrame(frame);
  man.rim.setFrame(frame);
  man.sprite.setPosition(x, y);
  man.rim.setPosition(x, y);
  man.shadow.setPosition(x + 3, y + 1);
  const sort = 7000 + groundY;
  man.shadow.setDepth(sort - 2);
  man.rim.setDepth(sort - 1);
  man.sprite.setDepth(sort);
}

function makeSoldier(scene, key, x, y, facing, extra) {
  const body = scene.physics.add.image(x, y, 'feet-small');
  body.setVisible(false);
  body.setCollideWorldBounds(true);
  body.setBounce(0);
  body.setFriction(0, 0);
  body.body.setAllowGravity(false);
  // Cover the standing picture, not just the soles, so Odysseus
  // goes around the man instead of through his chest.
  body.body.setSize(20, 28, false);
  body.body.setOffset((12 - 20) / 2, 8 - 28);
  const sprite = scene.add.sprite(x, y, key, WARRIOR_CONFIG.facingFrames[facing] ?? 0);
  sprite.setOrigin(0.5, 1);
  const rim = scene.add.sprite(x, y, key, 0).setOrigin(0.5, 1);
  rim.setTint(0xc5dcff);
  rim.setScale(1.08);
  const shadow = scene.add.ellipse(x, y, 14, 5, 0x0c1424, 0.5);
  return { body, sprite, rim, shadow, facing, ...extra };
}

// Spawned on the beach road, inside the gate mouth (x 416–544, y under 768).
// They run straight north through the doors, then peel off to a spot in the city.
const RUSH = [
  { x: 448, y: 678, goalX: 340, goalY: 300 },
  { x: 480, y: 700, goalX: 430, goalY: 270 },
  { x: 512, y: 678, goalX: 560, goalY: 290 },
  { x: 456, y: 736, goalX: 300, goalY: 380 },
  { x: 492, y: 752, goalX: 620, goalY: 340 },
  { x: 520, y: 736, goalX: 580, goalY: 400 },
  { x: 468, y: 760, goalX: 380, goalY: 410 },
  { x: 504, y: 748, goalX: 500, goalY: 250 },
];

// North of the wall, on open paving, then they walk south toward the gate.
const FOES = [
  { x: 440, y: 460, goalX: 445, goalY: 520 },
  { x: 500, y: 430, goalX: 495, goalY: 505 },
  { x: 390, y: 480, goalX: 400, goalY: 535 },
  { x: 555, y: 450, goalX: 545, goalY: 515 },
];

// Just inside the city. The wall's north face is y 592.
const GATE_CLEAR_Y = 548;
const FOE_SPEED = 70;

export function createRelief(scene) {
  const greeks = [];
  const foes = [];
  let phase = 'wait';
  let age = 0;
  let warned = false;

  return {
    start() {
      if (phase !== 'wait') return;
      phase = 'rush';
      age = 0;
      const key = WARRIOR_CONFIG.teams.greek.key;
      const tex = scene.textures.get(key);
      if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
      for (const spot of RUSH) {
        const man = makeSoldier(scene, key, spot.x, spot.y, 'n', {
          kind: 'greek',
          goalX: spot.goalX,
          goalY: spot.goalY,
          laneX: spot.x,
          via: true,
          side: 0,
          age: 0,
          arrived: false,
          gone: false,
        });
        scene.physics.add.collider(man.body, scene.blockers);
        if (scene.feet) scene.physics.add.collider(scene.feet, man.body);
        greeks.push(man);
      }
    },
    update(dt) {
      if (phase === 'wait') return;
      age += dt;
      for (const man of greeks) {
        if (man.gone) continue;
        stepRelief(man, RUN_SPEED);
        pose(man);
      }
      if (phase === 'rush' && age >= 1.8) {
        phase = 'foes';
        spawnFoes(scene, foes);
        if (!warned) {
          warned = true;
          scene.game.events.emit('notice', 'Trojans in the streets.');
        }
      }
      for (const man of foes) {
        if (man.gone) continue;
        stepRelief(man, FOE_SPEED);
        pose(man);
      }
    },
    nearestFoe(x, y, radius) {
      let best = null;
      let bestDist = radius;
      for (const man of foes) {
        if (man.gone) continue;
        const dist = Math.hypot(man.body.x - x, man.body.y - y);
        if (dist <= bestDist) {
          best = man;
          bestDist = dist;
        }
      }
      return best;
    },
    retire(man) {
      if (!man || man.gone) return;
      man.gone = true;
      retire(man);
    },
    separate(man, hero) {
      if (!man || man.gone) return;
      const y = Math.max(380, man.body.y - 90);
      man.body.setPosition(man.body.x, y);
      man.body.body.reset(man.body.x, y);
      man.arrived = false;
      man.via = false;
      const hy = Math.min(630, hero.y + 40);
      hero.setPosition(hero.x, hy);
      hero.body.reset(hero.x, hy);
    },
    greekCount() {
      return greeks.filter((man) => !man.gone).length;
    },
    foeCount() {
      return foes.filter((man) => !man.gone).length;
    },
    phase() {
      return phase;
    },
  };
}

function spawnFoes(scene, foes) {
  const key = WARRIOR_CONFIG.teams.trojan.key;
  const tex = scene.textures.get(key);
  if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  for (const spot of FOES) {
    const man = makeSoldier(scene, key, spot.x, spot.y, 's', {
      kind: 'trojan',
      goalX: spot.goalX,
      goalY: spot.goalY,
      laneX: spot.x,
      via: false,
      side: 0,
      age: 0,
      arrived: false,
      gone: false,
    });
    scene.physics.add.collider(man.body, scene.blockers);
    if (scene.feet) scene.physics.add.collider(scene.feet, man.body);
    foes.push(man);
  }
}

function stepRelief(man, speed) {
  if (man.arrived) {
    man.body.setVelocity(0, 0);
    return;
  }
  const clearing = man.via && man.body.y > GATE_CLEAR_Y;
  const tx = clearing ? man.laneX : man.goalX;
  const ty = clearing ? GATE_CLEAR_Y : man.goalY;
  const dx = tx - man.body.x;
  const dy = ty - man.body.y;
  const dist = Math.hypot(dx, dy);
  if (!clearing && dist < 18) {
    man.body.setVelocity(0, 0);
    man.arrived = true;
    man.via = false;
    return;
  }
  let ang = Math.atan2(dy, dx || 0.001);
  const blocked = man.body.body.blocked;
  const hit = blocked.up || blocked.down || blocked.left || blocked.right;
  if (hit) {
    if (!man.side) man.side = man.body.x < 480 ? 1 : -1;
    ang += man.side * 1.05;
  } else {
    man.side = 0;
  }
  const vx = Math.cos(ang);
  const vy = Math.sin(ang);
  man.body.setVelocity(vx * speed, vy * speed);
  man.facing = facingFromVector(vx, vy);
  if (man.via && man.body.y <= GATE_CLEAR_Y) man.via = false;
}
