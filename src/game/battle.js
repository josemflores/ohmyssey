// The two armies, and the standoff between them.
//
// Greeks (teal) spawn on the beach and follow Odysseus in a loose crowd.
// Trojans (crimson) spawn in the plaza and walk down toward the nearest Greek.
// When a pair gets close, onStandoff(pair) runs. The default hook calls
// engage(pair), which plays a shove: lunge, spear glint, knockback, dust.
//
// Later, the learning scene can pass its own onStandoff and start a puzzle
// here instead of the shove. Nobody takes damage yet.

import { frameFor, facingFromVector } from './warriorArt.js';

function nearest(unit, list) {
  let best = null;
  let bestD = Infinity;
  for (const other of list) {
    if (other.partner) continue;
    const d = Math.hypot(unit.body.x - other.body.x, unit.body.y - other.body.y);
    if (d < bestD) {
      best = other;
      bestD = d;
    }
  }
  return best;
}

const GREEK_SPEED = 64;
const TROJAN_SPEED = 56;
const SEPARATION = 20;
const STANDOFF = 30;
const PAIR_RANGE = 42;

// Slots behind Odysseus. Kept narrow so the group fits through the gate.
const SLOTS = [
  { x: -26, y: 28 },
  { x: 26, y: 28 },
  { x: -12, y: 48 },
  { x: 12, y: 48 },
  { x: -38, y: 46 },
  { x: 38, y: 46 },
  { x: 0, y: 66 },
];

const TROJAN_SPOTS = [
  { x: 340, y: 186 },
  { x: 400, y: 166 },
  { x: 560, y: 166 },
  { x: 640, y: 188 },
  { x: 300, y: 228 },
  { x: 420, y: 198 },
  { x: 548, y: 198 },
];

export class Battle {
  constructor(scene, { heroBody, ground, blockers, onStandoff }) {
    this.scene = scene;
    this.heroBody = heroBody;
    this.greeks = [];
    this.trojans = [];
    this.pairs = [];
    this.bodies = scene.physics.add.group();
    // Default: a shove. Replace this to hook a lesson into the standoff.
    this.onStandoff = onStandoff || ((pair) => this.engage(pair));

    SLOTS.forEach((slot, i) => {
      this.greeks.push(this.makeWarrior('greek', heroBody.x + slot.x, heroBody.y + slot.y, i));
    });
    TROJAN_SPOTS.forEach((spot, i) => {
      this.trojans.push(this.makeWarrior('trojan', spot.x, spot.y, i));
    });

    const all = this.bodies;
    scene.physics.add.collider(all, ground);
    scene.physics.add.collider(all, blockers);
    scene.physics.add.collider(all, all);
    // Odysseus shoves them aside. They do not shove him, so he cannot get stuck.
    scene.physics.add.collider(heroBody, all);
  }

  makeWarrior(team, x, y, index) {
    const body = this.scene.physics.add.image(x, y, 'feet-small');
    body.setVisible(false);
    body.setCollideWorldBounds(true);
    body.setBounce(0);
    body.setDrag(0, 0);
    this.bodies.add(body);

    const sprite = this.scene.add.sprite(x, y, `warrior-${team}`, 0);
    sprite.setOrigin(0.5, 1);

    return {
      team,
      index,
      body,
      sprite,
      partner: null,
      facing: team === 'greek' ? 'n' : 's',
      stuck: 0,
      jitter: Math.random() * Math.PI * 2,
    };
  }

  // Starts the little fight loop. Safe to call once; later calls do nothing.
  engage(pair) {
    if (pair.phase) return;
    pair.phase = 'lunge';
    pair.phaseT = 0;
    pair.glinted = false;
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.steer(dt, time);
    this.pairUp();
    this.stepFights(dt);
    this.pose(time);
  }

  steer(dt, time) {
    const hero = this.heroBody;
    for (const greek of this.greeks) {
      if (greek.partner) {
        greek.body.setVelocity(0, 0);
        continue;
      }
      const slot = SLOTS[greek.index];
      const jx = Math.sin(time / 700 + greek.jitter) * 4;
      const jy = Math.cos(time / 900 + greek.jitter) * 3;
      this.moveToward(greek, hero.x + slot.x + jx, hero.y + slot.y + jy, GREEK_SPEED, dt);
    }
    for (const trojan of this.trojans) {
      if (trojan.partner) {
        trojan.body.setVelocity(0, 0);
        continue;
      }
      const target = nearest(trojan, this.greeks);
      if (!target) {
        trojan.body.setVelocity(0, 0);
        continue;
      }
      this.moveToward(trojan, target.body.x, target.body.y, TROJAN_SPEED, dt);
    }
  }

  moveToward(unit, tx, ty, speed, dt) {
    let dx = tx - unit.body.x;
    let dy = ty - unit.body.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      unit.body.setVelocity(0, 0);
      unit.stuck = 0;
      return;
    }
    dx /= dist;
    dy /= dist;
    const push = this.separation(unit);
    let vx = dx * speed + push.x * 3;
    let vy = dy * speed + push.y * 3;
    // Pressing on a wall: step sideways so they walk around the horse and the gate.
    const current = unit.body.body ? unit.body.body.speed : 0;
    if (current < 12) unit.stuck += dt;
    else unit.stuck = 0;
    if (unit.stuck > 0.28) {
      vx += -dy * speed;
      vy += dx * speed;
    }
    const len = Math.hypot(vx, vy) || 1;
    unit.body.setVelocity((vx / len) * speed, (vy / len) * speed);
    unit.facing = facingFromVector(vx, vy);
  }

  separation(unit) {
    let x = 0;
    let y = 0;
    const others = unit.team === 'greek' ? this.greeks : this.trojans;
    for (const other of others) {
      if (other === unit) continue;
      const dx = unit.body.x - other.body.x;
      const dy = unit.body.y - other.body.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < SEPARATION) {
        x += (dx / d) * (SEPARATION - d);
        y += (dy / d) * (SEPARATION - d);
      }
    }
    const hx = unit.body.x - this.heroBody.x;
    const hy = unit.body.y - this.heroBody.y;
    const hd = Math.hypot(hx, hy);
    if (hd > 0 && hd < SEPARATION + 4) {
      x += (hx / hd) * (SEPARATION + 4 - hd);
      y += (hy / hd) * (SEPARATION + 4 - hd);
    }
    return { x, y };
  }

  pairUp() {
    const freeTrojans = this.trojans.filter((t) => !t.partner);
    for (const greek of this.greeks) {
      if (greek.partner) continue;
      let best = null;
      let bestD = PAIR_RANGE;
      for (const trojan of freeTrojans) {
        if (trojan.partner) continue;
        const d = Math.hypot(greek.body.x - trojan.body.x, greek.body.y - trojan.body.y);
        if (d < bestD) {
          best = trojan;
          bestD = d;
        }
      }
      if (!best) continue;
      greek.partner = best;
      best.partner = greek;
      greek.body.setVelocity(0, 0);
      best.body.setVelocity(0, 0);
      const pair = { greek, trojan: best, phase: null, phaseT: 0, glinted: false };
      this.pairs.push(pair);
      this.onStandoff(pair);
    }
  }

  stepFights(dt) {
    for (const pair of this.pairs) {
      if (!pair.phase) continue;
      pair.phaseT += dt;
      const g = pair.greek;
      const t = pair.trojan;
      const dx = t.body.x - g.body.x;
      const dy = t.body.y - g.body.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      g.facing = facingFromVector(ux, uy);
      t.facing = facingFromVector(-ux, -uy);

      if (pair.phase === 'lunge') {
        g.body.setVelocity(ux * 48, uy * 48);
        t.body.setVelocity(-ux * 48, -uy * 48);
        if (!pair.glinted) {
          pair.glinted = true;
          this.glint(g.body.x, g.body.y, t.body.x, t.body.y);
        }
        if (pair.phaseT > 0.16) {
          pair.phase = 'back';
          pair.phaseT = 0;
          g.body.setVelocity(-ux * 80, -uy * 80);
          t.body.setVelocity(ux * 80, uy * 80);
          this.dust((g.body.x + t.body.x) / 2, (g.body.y + t.body.y) / 2);
        }
      } else if (pair.phase === 'back') {
        if (pair.phaseT > 0.22) {
          pair.phase = 'hold';
          pair.phaseT = 0;
          g.body.setVelocity(0, 0);
          t.body.setVelocity(0, 0);
        }
      } else if (pair.phase === 'hold' && pair.phaseT > 0.85) {
        // If the shove pushed them apart, walk back to the standoff gap first.
        if (len > STANDOFF + 10) {
          g.body.setVelocity(ux * 36, uy * 36);
          t.body.setVelocity(-ux * 36, -uy * 36);
        } else {
          pair.phase = 'lunge';
          pair.phaseT = 0;
          pair.glinted = false;
          g.body.setVelocity(0, 0);
          t.body.setVelocity(0, 0);
        }
      }
    }
  }

  glint(x1, y1, x2, y2) {
    const spark = this.scene.add.circle((x1 + x2) / 2, (y1 + y2) / 2 - 12, 3, 0xfff6d0, 1);
    spark.setDepth(8800);
    spark.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 2,
      duration: 160,
      onComplete: () => spark.destroy(),
    });
  }

  dust(x, y) {
    for (let i = 0; i < 3; i += 1) {
      const puff = this.scene.add.circle(x + (i - 1) * 4, y, 2, 0xe6d7b4, 0.75);
      puff.setDepth(8700);
      this.scene.tweens.add({
        targets: puff,
        y: y - 6,
        alpha: 0,
        duration: 280,
        onComplete: () => puff.destroy(),
      });
    }
  }

  pose(time) {
    const step = Math.floor(time / 180) % 2 === 1;
    for (const unit of this.greeks.concat(this.trojans)) {
      const speed = unit.body.body ? unit.body.body.speed : 0;
      const moving = speed > 8 && !unit.partner;
      const frame = frameFor(unit.facing, moving && step);
      unit.sprite.setFrame(frame);
      // body.y is the center of the little feet box. The picture's origin is its feet.
      const groundY = unit.body.y + unit.body.height / 2;
      unit.sprite.setPosition(Math.round(unit.body.x), Math.round(groundY));
      unit.sprite.setDepth(groundY);
    }
  }

  summary() {
    const pack = (unit) => ({
      team: unit.team,
      x: unit.body.x,
      y: unit.body.y,
      paired: Boolean(unit.partner),
    });
    return {
      greeks: this.greeks.map(pack),
      trojans: this.trojans.map(pack),
      pairs: this.pairs.length,
      engaged: this.pairs.filter((pair) => pair.phase).length,
    };
  }
}
