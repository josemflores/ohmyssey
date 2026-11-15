// Fight numbers, and the Greeks who leave the horse.
//
// No Trojan soldiers stand on the map. Walking for a while opens the
// battle screen. The three Greeks who climb out do not follow Odysseus.
// They peel off into the city, as if the sack has already started.

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

// Seconds of walking between battles.
export const WALK_FIGHT_SECONDS = 10;

// Away from the hatch: west, east, and north into the streets.
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
      return {
        id: q.id,
        prompt: q.prompt,
        choices: q.choices.slice(),
        answer: q.answer,
      };
    },
  };
}

export function createScatter(scene, { ground, blockers, fromHorse }) {
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
  body.body.setAllowGravity(false);
  const sprite = scene.add.sprite(x, y, key, WARRIOR_CONFIG.facingFrames[facing] ?? 0);
  sprite.setOrigin(0.5, 1);
  const rim = scene.add.sprite(x, y, key, 0).setOrigin(0.5, 1);
  rim.setTint(0xc5dcff);
  rim.setScale(1.08);
  const shadow = scene.add.ellipse(x, y, 14, 5, 0x0c1424, 0.5);
  return { body, sprite, rim, shadow, facing, ...extra };
}
