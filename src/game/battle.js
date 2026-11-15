// The two armies, and the standoff between them.
//
// On the beach the Greeks (teal) trail Odysseus in a wedge.
// Once he is through the gate they walk to a rank, each on his own slot,
// facing north. The Trojans (crimson) hold the rank just north of them,
// facing south, with about one tile of open ground between the lines.
//
// onStandoff(pair) fires when a pair is in place. The default calls
// engage(pair): a 5px lunge, a glint, then they spring back. No damage.
// A later lesson can replace onStandoff and leave them standing there.

import { facingFromVector } from './animConfig.js';
import { WARRIOR_CONFIG, warriorFrame } from './warriorConfig.js';

const GREEK_SPEED = 70;
const TROJAN_SPEED = 62;
const SEPARATION = 34;

// Behind Odysseus, narrow enough to fit the gate, wide enough not to stack.
const WEDGE = [
  { x: -22, y: 40 },
  { x: 22, y: 40 },
  { x: -38, y: 62 },
  { x: 38, y: 62 },
  { x: 0, y: 64 },
  { x: -18, y: 86 },
  { x: 16, y: 86 },
];

// Unique slots. 48px apart, so the 32px sprites do not touch.
const RANK_X = [336, 384, 432, 480, 528, 576, 624];
const TROJAN_Y = 268;
const GREEK_Y = 318;
// He has crossed the wall. The wedge becomes the rank.
const FORM_UP_Y = 360;

export class Battle {
  constructor(scene, { heroBody, ground, blockers, onStandoff }) {
    this.scene = scene;
    this.heroBody = heroBody;
    this.greeks = [];
    this.trojans = [];
    this.pairs = [];
    this.bodies = scene.physics.add.group();
    this.onStandoff = onStandoff || ((pair) => this.engage(pair));

    WEDGE.forEach((slot, i) => {
      this.greeks.push(this.makeWarrior(
        'greek',
        heroBody.x + slot.x,
        heroBody.y + slot.y,
        i,
      ));
    });
    RANK_X.forEach((x, i) => {
      // Start a little north of the line so they are seen walking down.
      this.trojans.push(this.makeWarrior('trojan', x, TROJAN_Y - 36, i));
    });

    const all = this.bodies;
    scene.physics.add.collider(all, ground);
    scene.physics.add.collider(all, blockers);
    scene.physics.add.collider(all, all);
    scene.physics.add.collider(heroBody, all);
  }

  makeWarrior(team, x, y, index) {
    const body = this.scene.physics.add.image(x, y, 'feet-small');
    body.setVisible(false);
    body.setCollideWorldBounds(true);
    body.setBounce(0);
    body.setDrag(0, 0);
    this.bodies.add(body);

    const key = WARRIOR_CONFIG.teams[team].key;
    const sprite = this.scene.add.sprite(x, y, key, 0).setOrigin(0.5, 1);
    const rim = this.scene.add.sprite(x, y, key, 0).setOrigin(0.5, 1);
    rim.setTint(0xc5dcff);
    rim.setScale(1.08);
    const shadow = this.scene.add.ellipse(x, y, 14, 5, 0x0c1424, 0.55);

    return {
      team,
      index,
      body,
      sprite,
      rim,
      shadow,
      partner: null,
      facing: team === 'greek' ? 'n' : 's',
      stuck: 0,
    };
  }

  formedUp() {
    return this.heroBody.y < FORM_UP_Y;
  }

  // Starts the small lunge. Safe to call again; it will not restart mid-swing.
  engage(pair) {
    if (pair.phase) return;
    pair.phase = 'lunge';
    pair.phaseT = 0;
    pair.glinted = false;
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.steer(dt);
    this.pairUp();
    this.stepFights(dt);
    this.pose(time);
  }

  steer(dt) {
    const formed = this.formedUp();
    for (const greek of this.greeks) {
      if (greek.partner) continue;
      if (formed) {
        greek.facing = 'n';
        this.moveToward(greek, RANK_X[greek.index], GREEK_Y, GREEK_SPEED, dt, 6);
      } else {
        const slot = WEDGE[greek.index];
        this.moveToward(
          greek,
          this.heroBody.x + slot.x,
          this.heroBody.y + slot.y,
          GREEK_SPEED,
          dt,
          10,
        );
      }
    }
    for (const trojan of this.trojans) {
      if (trojan.partner) continue;
      trojan.facing = 's';
      this.moveToward(trojan, RANK_X[trojan.index], TROJAN_Y, TROJAN_SPEED, dt, 6);
    }
  }

  moveToward(unit, tx, ty, speed, dt, arrive) {
    let dx = tx - unit.body.x;
    let dy = ty - unit.body.y;
    const dist = Math.hypot(dx, dy);
    if (dist < arrive) {
      unit.body.setVelocity(0, 0);
      unit.stuck = 0;
      // Parked on a rank, they face the other line. On the beach they
      // keep the facing they had while walking.
      if (this.formedUp()) unit.facing = unit.team === 'greek' ? 'n' : 's';
      return;
    }
    dx /= dist;
    dy /= dist;
    const push = this.separation(unit);
    let vx = dx * speed + push.x * 4;
    let vy = dy * speed + push.y * 4;
    const current = unit.body.body ? unit.body.body.speed : 0;
    if (current < 10) unit.stuck += dt;
    else unit.stuck = 0;
    if (unit.stuck > 0.3) {
      vx += -dy * speed;
      vy += dx * speed;
    }
    const len = Math.hypot(vx, vy) || 1;
    unit.body.setVelocity((vx / len) * speed, (vy / len) * speed);
    // Face the way they are walking. The standoff locks N and S once paired.
    unit.facing = facingFromVector(vx, vy);
  }

  separation(unit) {
    let x = 0;
    let y = 0;
    const crowd = this.greeks.concat(this.trojans);
    for (const other of crowd) {
      if (other === unit || other.partner) continue;
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
    if (hd > 0 && hd < 28) {
      x += (hx / hd) * (28 - hd);
      y += (hy / hd) * (28 - hd);
    }
    return { x, y };
  }

  pairUp() {
    if (!this.formedUp()) return;
    for (let i = 0; i < this.greeks.length; i += 1) {
      const greek = this.greeks[i];
      const trojan = this.trojans[i];
      if (!greek || !trojan || greek.partner) continue;
      const greekHome = Math.hypot(greek.body.x - RANK_X[i], greek.body.y - GREEK_Y) < 14;
      const trojanHome = Math.hypot(trojan.body.x - RANK_X[i], trojan.body.y - TROJAN_Y) < 14;
      if (!greekHome || !trojanHome) continue;
      greek.partner = trojan;
      trojan.partner = greek;
      greek.facing = 'n';
      trojan.facing = 's';
      greek.body.setVelocity(0, 0);
      trojan.body.setVelocity(0, 0);
      const pair = { greek, trojan, phase: null, phaseT: 0, glinted: false, slot: i };
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
      const x = RANK_X[pair.slot];
      // About 5px of travel, then spring back to the slot. No sideways drift.
      if (pair.phase === 'lunge') {
        g.body.setVelocity(0, -42);
        t.body.setVelocity(0, 42);
        if (!pair.glinted) {
          pair.glinted = true;
          this.glint(x, (GREEK_Y + TROJAN_Y) / 2);
        }
        if (pair.phaseT > 0.12) {
          pair.phase = 'back';
          pair.phaseT = 0;
          this.dust(x, (GREEK_Y + TROJAN_Y) / 2);
        }
      } else if (pair.phase === 'back') {
        g.body.setVelocity(0, 42);
        t.body.setVelocity(0, -42);
        if (pair.phaseT > 0.12) {
          pair.phase = 'hold';
          pair.phaseT = 0;
          this.park(g, x, GREEK_Y);
          this.park(t, x, TROJAN_Y);
        }
      } else if (pair.phaseT > 0.9) {
        this.park(g, x, GREEK_Y);
        this.park(t, x, TROJAN_Y);
        pair.phase = 'lunge';
        pair.phaseT = 0;
        pair.glinted = false;
      } else {
        this.park(g, x, GREEK_Y);
        this.park(t, x, TROJAN_Y);
      }
      g.facing = 'n';
      t.facing = 's';
    }
  }

  park(unit, x, y) {
    unit.body.setVelocity(0, 0);
    unit.body.setPosition(x, y);
    if (unit.body.body && unit.body.body.reset) unit.body.body.reset(x, y);
  }

  glint(x, y) {
    const spark = this.scene.add.circle(x, y - 14, 3, 0xfff6d0, 1);
    spark.setDepth(9000);
    spark.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: spark,
      alpha: 0,
      duration: 140,
      onComplete: () => spark.destroy(),
    });
  }

  dust(x, y) {
    for (let i = 0; i < 3; i += 1) {
      const puff = this.scene.add.circle(x + (i - 1) * 5, y, 2, 0xe6d7b4, 0.8);
      puff.setDepth(8900);
      this.scene.tweens.add({
        targets: puff,
        y: y - 4,
        alpha: 0,
        duration: 260,
        onComplete: () => puff.destroy(),
      });
    }
  }

  pose(time) {
    const walk = WARRIOR_CONFIG.walk;
    const rate = walk && walk.frameRate > 0 ? walk.frameRate : 8;
    const stepIndex = Math.floor(time / (1000 / rate));
    for (const unit of this.greeks.concat(this.trojans)) {
      const speed = unit.body.body ? unit.body.body.speed : 0;
      const moving = speed > 8 && !unit.partner;
      const frame = warriorFrame(unit.facing, moving, stepIndex);
      const groundY = unit.body.y + unit.body.height / 2;
      // Same idle bob as Odysseus. A real walk sheet replaces it.
      const hop = !walk && moving ? Math.abs(Math.sin((time + unit.index * 90) / 110)) : 0;
      const px = Math.round(unit.body.x);
      const py = Math.round(groundY - hop * 1.7);
      unit.sprite.setScale(1 + hop * 0.04, 1 - hop * 0.07);
      unit.sprite.setFrame(frame);
      unit.sprite.setPosition(px, py);
      unit.rim.setScale(1.08 * (1 + hop * 0.04), 1.08 * (1 - hop * 0.07));
      unit.rim.setFrame(frame);
      unit.rim.setPosition(px, py);
      // Moon is up-left, so the shadow sits a little down and to the right.
      unit.shadow.setPosition(px + 4, py + 1);
      const sort = 7000 + groundY;
      unit.shadow.setDepth(sort - 2);
      unit.rim.setDepth(sort - 1);
      unit.sprite.setDepth(sort);
    }
  }

  summary() {
    const pack = (unit) => ({
      team: unit.team,
      x: unit.body.x,
      y: unit.body.y,
      facing: unit.facing,
      frame: unit.sprite.frame.name,
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
