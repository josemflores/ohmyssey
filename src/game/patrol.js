// The walk from the horse to the gate.
//
// Four Trojan sentries stand off the road. They walk at Odysseus's walk
// speed once he steps into their sight, and a touch starts a fight.
// The three Greeks who climbed out of the horse do not follow him. They
// peel off into the city, as if the sack has already started.

import { facingFromVector } from './animConfig.js';
import { HATCH_QUESTIONS } from './hatchQuestions.js';
import { MAP_W } from './map.js';
import { WARRIOR_CONFIG } from './warriorConfig.js';

export const WALK_SPEED = 80;
export const RUN_SPEED = 136;

export const HERO_MAX = 30;
export const FOE_MAX = 12;
export const FULL_HIT = 6;
export const WEAK_HIT = 4.5;
export const FOE_HIT = 4;

const DETECT = 112;
const CONTACT = 28;
const HINT_RADIUS = 160;

// On the bends: west lane, east lane, then the last stretch to the gate.
const SENTRIES = [
  { id: 'sentry-1', x: 420, y: 340 },
  { id: 'sentry-2', x: 280, y: 430 },
  { id: 'sentry-3', x: 520, y: 500 },
  { id: 'sentry-4', x: 460, y: 560 },
];

// Away from the hatch: west, east, and north into the streets.
const SCATTER = [
  { ox: -28, oy: 8, goalX: -140, goalY: 200 },
  { ox: 28, oy: 10, goalX: MAP_W + 140, goalY: 180 },
  { ox: -8, oy: -6, goalX: 220, goalY: -140 },
];

const CALM_SECONDS = 3.2;

export function createPatrol(scene, { ground, blockers, fromHorse }) {
  const greekKey = WARRIOR_CONFIG.teams.greek.key;
  const trojanKey = WARRIOR_CONFIG.teams.trojan.key;
  for (const key of [greekKey, trojanKey]) {
    const tex = scene.textures.get(key);
    if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  const defeated = new Set(scene.game.registry.get('defeatedSentries') || []);
  const sentries = SENTRIES
    .filter((spot) => !defeated.has(spot.id))
    .map((spot) => makeSoldier(scene, trojanKey, spot.x, spot.y, 's', {
      id: spot.id,
      hp: FOE_MAX,
      homeX: spot.x,
      homeY: spot.y,
      aggro: false,
      kind: 'sentry',
    }));

  const greeks = [];
  if (fromHorse && !scene.game.registry.get('greeksScattered')) {
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
      greeks.push(man);
    });
  }

  let calm = fromHorse ? CALM_SECONDS : 0;

  for (const man of [...sentries, ...greeks]) {
    scene.physics.add.collider(man.body, ground);
    scene.physics.add.collider(man.body, blockers);
  }

  let questionIndex = 0;

  return {
    sentries,
    greeks,
    question() {
      const q = HATCH_QUESTIONS[questionIndex % HATCH_QUESTIONS.length];
      questionIndex += 1;
      return {
        id: q.id,
        prompt: q.prompt,
        choices: q.choices.slice(),
        answer: q.answer,
      };
    },
    update(dt, heroX, heroY, frozen) {
      const hold = calm > 0;
      if (calm > 0) calm -= dt;
      for (let i = greeks.length - 1; i >= 0; i -= 1) {
        const man = greeks[i];
        stepGreek(man, scene, dt);
        if (man.gone) {
          retire(man);
          greeks.splice(i, 1);
        }
      }
      for (const man of sentries) {
        if (man.dead) continue;
        stepSentry(man, heroX, heroY, frozen || hold, dt);
      }
      for (const man of [...sentries, ...greeks]) pose(man);
    },
    nearestSentry(x, y) {
      let best = null;
      let bestDist = Infinity;
      for (const man of sentries) {
        if (man.dead) continue;
        const dist = Math.hypot(man.body.x - x, man.body.y - y);
        if (dist < bestDist) {
          best = man;
          bestDist = dist;
        }
      }
      return best ? { man: best, dist: bestDist } : null;
    },
    firstSentry() {
      let best = null;
      for (const man of sentries) {
        if (man.dead) continue;
        if (!best || man.homeY < best.homeY) best = man;
      }
      return best;
    },
    remove(man) {
      man.dead = true;
      man.body.destroy();
      man.sprite.destroy();
      man.rim.destroy();
      man.shadow.destroy();
      const ids = scene.game.registry.get('defeatedSentries') || [];
      if (!ids.includes(man.id)) scene.game.registry.set('defeatedSentries', [...ids, man.id]);
    },
  };
}

export function hintDistance() {
  return HINT_RADIUS;
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

function stepSentry(man, heroX, heroY, frozen, dt) {
  if (frozen) {
    man.body.setVelocity(0, 0);
    man.touch = false;
    return;
  }
  const dx = heroX - man.body.x;
  const dy = heroY - man.body.y;
  const dist = Math.hypot(dx, dy);
  if (!man.aggro && dist <= DETECT) man.aggro = true;
  man.touch = man.aggro && dist <= CONTACT;
  if (!man.aggro || dist < 4) {
    man.body.setVelocity(0, 0);
    return;
  }
  man.body.setVelocity((dx / dist) * WALK_SPEED, (dy / dist) * WALK_SPEED);
  man.facing = facingFromVector(dx, dy);
  void dt;
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
  body.body.setAllowGravity(false);
  const sprite = scene.add.sprite(x, y, key, WARRIOR_CONFIG.facingFrames[facing] ?? 0);
  sprite.setOrigin(0.5, 1);
  const rim = scene.add.sprite(x, y, key, 0).setOrigin(0.5, 1);
  rim.setTint(0xc5dcff);
  rim.setScale(1.08);
  const shadow = scene.add.ellipse(x, y, 14, 5, 0x0c1424, 0.5);
  return { body, sprite, rim, shadow, facing, ...extra };
}
