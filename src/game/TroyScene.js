// Troy at night.
//
// Phaser draws the map. React only hosts the canvas (see TroyWorld.jsx).
// Odysseus is two pieces:
//   feet — a small invisible box that collides with the world
//   hero — the picture, which follows the feet. A walk sheet plays while he
//   moves; without one, the idle frame bobs instead.
// The picture is taller than the box, so he can stand "behind" columns and roofs.

import Phaser from 'phaser';
import { ANIM_CONFIG, facingFromVector } from './animConfig.js';
import {
  DECOR,
  FEET,
  GATE_MARK,
  INTERACT_RADIUS,
  INTERACTABLES,
  LAMPS,
  MAP_H,
  MAP_W,
  PROPS,
  SPAWN,
  buildMap,
  solidRects,
} from './map.js';
import {
  createRelief,
  FOE_HIT,
  FOE_MAX,
  HERO_MAX,
  RUN_SPEED,
  WALK_SPEED,
} from './patrol.js';
import { attackById, createBattleQuestions } from './battleQuestions.js';
import { WARRIOR_CONFIG } from './warriorConfig.js';
import { routeReport } from './routeCheck.js';
import { buildWorldTextures } from './textures.js';

// Walk speed lives in patrol.js so the sentries match him. Shift runs.
// The LPC figure fills about 25 of the 32px cell. 4/3 brings him in line
// with the army sprites (about 30px tall) and stays on whole screen pixels
// at the camera's 3× zoom.
const HERO_SCALE = 4 / 3;

// How long each battle picture plays before the turn strip moves on.
const GATE_HP = 24;

const BLOW_MS = {
  jab: 520,
  strike: 700,
  heavy: 1000,
  whiff: 560,
  counter: 680,
  defeat: 1500,
};

export class TroyScene extends Phaser.Scene {
  constructor() {
    super('troy');
    this.facing = 'n';
  }

  preload() {
    // Coming back from the horse, these pictures are already loaded.
    // Loading them again wipes the texture other scenes are still using.
    if (!this.textures.exists(ANIM_CONFIG.textureKey)) {
      this.load.spritesheet(ANIM_CONFIG.textureKey, ANIM_CONFIG.path, {
        frameWidth: ANIM_CONFIG.frameWidth,
        frameHeight: ANIM_CONFIG.frameHeight,
      });
    }

    const walk = ANIM_CONFIG.walk;
    if (walk && !this.textures.exists('odysseus-walk')) {
      this.load.spritesheet('odysseus-walk', walk.path, {
        frameWidth: walk.frameWidth,
        frameHeight: walk.frameHeight,
      });
    }

    // Real PixelLab sheets. See warriorConfig.js. Greek is red, Trojan is teal.
    for (const team of Object.values(WARRIOR_CONFIG.teams)) {
      if (!team.path || this.textures.exists(team.key)) continue;
      this.load.spritesheet(team.key, team.path, {
        frameWidth: WARRIOR_CONFIG.frameWidth,
        frameHeight: WARRIOR_CONFIG.frameHeight,
      });
    }

    // Eight facings. The plaza uses frame 0 (south). Native 128px, no rescale.
    if (!this.textures.exists('horse')) {
      this.load.spritesheet('horse', '/assets/sprites/trojan_horse.png', {
        frameWidth: 128,
        frameHeight: 128,
      });
    }
  }

  create() {
    const report = routeReport();
    if (!report.ok) {
      console.warn(`Troy layout problem:\n${report.problems.join('\n')}`);
    }

    if (!this.textures.exists('tiles')) buildWorldTextures(this);
    if (ANIM_CONFIG.walk && !this.anims.exists('walk-s')) this.createWalkAnims();
    if (!this.anims.exists('lamp-flicker')) {
      this.anims.create({
        key: 'lamp-flicker',
        frames: this.anims.generateFrameNumbers('oil-lamp', { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1,
      });
    }
    const horseTex = this.textures.get('horse');
    if (horseTex) horseTex.setFilter(Phaser.Textures.FilterMode.NEAREST);

    const grid = buildMap();
    const map = this.make.tilemap({ data: grid, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage('tiles');
    const ground = map.createLayer(0, tiles, 0, 0);
    ground.setDepth(0);
    this.ground = ground;
    // Walls, sea, and the map edge are rectangles, not a colliding tile each.
    // Per-tile faces were catching his feet and sticking him in open lanes.
    this.blockers = this.physics.add.staticGroup();
    for (const rect of solidRects(grid)) {
      addRect(this, this.blockers, rect.x, rect.y, rect.w, rect.h);
    }
    for (const prop of PROPS) addSolidProp(this, this.blockers, prop);
    for (const decor of DECOR) {
      this.add.image(decor.x, decor.baseY, decor.id).setOrigin(0.5, 1).setDepth(7000 + decor.baseY);
    }

    this.glints = createGlints(this);
    // Deep blue moonlight, about half the brightness of the pale stone underneath.
    // Lamps and people are drawn later, above this grade.
    const moon = this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x6a7c9e, 1);
    moon.setBlendMode(Phaser.BlendModes.MULTIPLY);
    moon.setDepth(5000);
    for (const lamp of LAMPS) addLamp(this, this.blockers, lamp);

    this.vignette = this.add.image(0, 0, 'vignette')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(15000)
      .setAlpha(0.62);
    const fitVignette = () => {
      this.vignette.setDisplaySize(this.scale.width, this.scale.height);
    };
    fitVignette();
    this.scale.on('resize', fitVignette);

    // Feet are the body. The picture is drawn separately, from the ankles up.
    const start = this.arrive || SPAWN;
    if (this.arrive) this.game.registry.set('leftHorse', true);
    this.feet = this.physics.add.image(start.x, start.y, 'feet');
    this.feet.setVisible(false);
    this.feet.body.setSize(FEET.w, FEET.h, true);
    this.feet.setCollideWorldBounds(true);
    this.feet.body.setAllowGravity(false);
    this.feet.setBounce(0);
    this.feet.setFriction(0, 0);
    this.feet.setDrag(0);
    // Warriors bounce off him. He does not get pushed, so a crowd cannot pin him.
    this.feet.body.pushable = false;
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    // Larger than the feet. A 4px bias ignored any deeper overlap, so he
    // sank into a wall and stayed there. The overlap bias does the same
    // job for the long wall rectangles: a slow frame must not tunnel.
    this.physics.world.TILE_BIAS = 32;
    this.physics.world.OVERLAP_BIAS = 24;

    this.heroRim = this.add.sprite(start.x, start.y, ANIM_CONFIG.textureKey, ANIM_CONFIG.facingFrames.n);
    this.heroRim.setOrigin(0.5, 1);
    this.heroRim.setTint(0xd0e6ff);
    this.heroRim.setScale(HERO_SCALE * 1.07);
    this.hero = this.add.sprite(start.x, start.y, ANIM_CONFIG.textureKey, ANIM_CONFIG.facingFrames.n);
    this.hero.setOrigin(0.5, 1);
    this.hero.setScale(HERO_SCALE);
    this.heroShadow = this.add.ellipse(start.x, start.y, 24, 7, 0x0c1424, 0.55);

    this.physics.add.collider(this.feet, this.blockers);

    // The road stays empty. Four sentries brace the shut doors until the
    // gate battle is won. Street foes still come from relief, if it starts.
    addGateSentries(this);
    this.questions = createBattleQuestions();
    this.relief = createRelief(this);
    this.fightCooldown = 0;
    this.engagedFoe = null;
    this.gateFalling = false;
    this.heroHp = this.game.registry.get('heroHp') ?? HERO_MAX;
    this.fighting = false;
    this.fight = null;
    this.questDone = !!this.game.registry.get('gateOpen');
    this.runHintShown = !!this.game.registry.get('runHintShown');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.getElementById('gate-arrow')?.remove();
    });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W, MAP_H);
    cam.setZoom(3);
    cam.roundPixels = true;
    cam.startFollow(this.feet, true, 0.16, 0.16);
    cam.fadeIn(400, 6, 10, 18);

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
      arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      keyE: Phaser.Input.Keyboard.KeyCodes.E,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });
    this.input.keyboard.addCapture([
      'W', 'A', 'S', 'D', 'E', 'SHIFT', 'UP', 'DOWN', 'LEFT', 'RIGHT',
    ]);

    // A dialogue or puzzle sets this so he stops walking.
    // E still works while locked: it asks React to close the box.
    this.inputLocked = false;
    this.nearest = null;
    this.prompt = makePrompt(this);

    const lockInput = () => { this.inputLocked = true; };
    const unlockInput = () => {
      if (this.gateFalling) return;
      this.inputLocked = false;
    };
    const onStrike = (payload) => this.resolveStrike(payload);
    const onEnemyAct = () => this.enemyAct();
    const onAttack = (payload) => {
      if (!this.fight) return;
      const attack = attackById(payload && payload.kind);
      this.fight.attack = attack;
      const question = this.questions.next(attack.difficulty);
      this.fight.question = question;
      this.game.events.emit('fightQuestion', {
        id: question.id,
        prompt: question.prompt,
        choices: question.choices,
        attack: attack.label,
      });
    };
    const onFlee = () => {
      if (!this.fighting || !this.fight || this.fight.question) return;
      const gate = this.fight.gate;
      this.endFight(false, gate
        ? 'You fall back. The gate stays shut.'
        : 'You slip past the sentry.');
    };
    this.game.events.on('lockInput', lockInput);
    this.game.events.on('unlockInput', unlockInput);
    this.game.events.on('fightStrike', onStrike);
    this.game.events.on('fightAttack', onAttack);
    this.game.events.on('fightEnemyAct', onEnemyAct);
    this.game.events.on('fightFlee', onFlee);

    publishDebug(this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('lockInput', lockInput);
      this.game.events.off('unlockInput', unlockInput);
      this.game.events.off('fightStrike', onStrike);
      this.game.events.off('fightAttack', onAttack);
      this.game.events.off('fightEnemyAct', onEnemyAct);
      this.game.events.off('fightFlee', onFlee);
      if (globalThis.__troy?.owner === this) delete globalThis.__troy;
    });
  }

  init(data) {
    // HorseScene sends him back here, beside the horse, instead of the beach.
    this.arrive = data && Number.isFinite(data.x) ? data : null;
  }

  // React listens for this. payload.id is the spot from map.js.
  interact(target) {
    if (!target || this.inputLocked) return;
    if (target.id === 'horse_hatch') {
      // Once the hatch has let him out, it does not open again.
      if (this.game.registry.get('leftHorse')) return;
      this.scene.start('horse');
      return;
    }
    if (target.id === 'gate') {
      if (this.questDone || this.fighting || this.gateFalling) return;
      this.feet.setVelocity(0, 0);
      if (this.prompt) this.prompt.setVisible(false);
      this.beginFight({ gate: true });
      return;
    }
    this.game.events.emit('interact', {
      id: target.id,
      type: target.type,
      x: target.x,
      y: target.y,
      prompt: target.prompt,
    });
  }

  createWalkAnims() {
    const walk = ANIM_CONFIG.walk;
    const order = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
    order.forEach((dir, row) => {
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers('odysseus-walk', {
          start: row * walk.framesPerFacing,
          end: (row + 1) * walk.framesPerFacing - 1,
        }),
        frameRate: walk.frameRate,
        repeat: -1,
      });
    });
  }

  update(time, delta) {
    clampToMap(this.feet);
    // While a box is open he stands still. Keys do nothing until it closes.
    const locked = this.inputLocked;
    const left = !locked && (this.keys.left.isDown || this.keys.arrowLeft.isDown);
    const right = !locked && (this.keys.right.isDown || this.keys.arrowRight.isDown);
    const up = !locked && (this.keys.up.isDown || this.keys.arrowUp.isDown);
    const down = !locked && (this.keys.down.isDown || this.keys.arrowDown.isDown);

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    const running = !locked && this.keys.shift.isDown;
    if (vx === 0 && vy === 0) {
      this.feet.setVelocity(0, 0);
    } else {
      // (1, 1) has length sqrt(2). Divide so a diagonal is not a speed boost.
      const len = Math.hypot(vx, vy);
      const speed = running ? RUN_SPEED : WALK_SPEED;
      this.feet.setVelocity((vx / len) * speed, (vy / len) * speed);
      this.facing = facingFromVector(vx, vy);
    }

    const moving = this.feet.body.speed > 8;
    const groundY = this.feet.y + this.feet.body.halfHeight;
    const bob = poseHero(this.hero, this.facing, moving, time);
    const hx = Math.round(this.feet.x);
    const hy = Math.round(groundY + bob);
    this.hero.setPosition(hx, hy);
    // The rim is a second copy of the same picture. Walk frames live on a
    // different sheet than idle, so the rim has to follow the texture too.
    if (this.heroRim.texture !== this.hero.texture) {
      this.heroRim.setTexture(this.hero.texture.key);
    }
    this.heroRim.setFrame(this.hero.frame.name);
    this.heroRim.setOrigin(0.5, 1);
    this.heroRim.setScale(this.hero.scaleX * 1.07, this.hero.scaleY * 1.07);
    this.heroRim.setPosition(hx, hy);
    this.heroShadow.setPosition(hx + 4, Math.round(groundY) + 1);
    // Above the moonlight so he stays readable. y still decides who is in front.
    const sort = 7000 + groundY;
    this.heroShadow.setDepth(sort - 2);
    this.heroRim.setDepth(sort - 1);
    this.hero.setDepth(sort);

    // The closest spot he is standing inside, or null.
    this.nearest = locked ? null : nearestInteractable(this.feet.x, this.feet.y, this);
    if (this.nearest) {
      this.prompt.setVisible(true);
      this.prompt.setPosition(Math.round(this.feet.x), Math.round(groundY) - 48);
      this.prompt.setDepth(sort + 4);
    } else {
      this.prompt.setVisible(false);
    }

    // JustDown is true only on the frame E goes down, so holding E does not repeat.
    // If a box is already open, the same key asks React to close it.
    if (!this.fighting && Phaser.Input.Keyboard.JustDown(this.keys.keyE)) {
      if (locked) {
        if (!this.gateFalling) this.game.events.emit('closeInteract');
      } else if (this.nearest) this.interact(this.nearest);
    }

    const dt = delta / 1000;
    for (const glint of this.glints) {
      glint.x += glint.speed * dt;
      if (glint.x > MAP_W + 20) glint.x = -20;
    }

    this.relief.update(dt);
    if (this.fightCooldown > 0) this.fightCooldown -= dt;
    this.maybeHintRun(moving);
    if (!this.fighting && !locked) this.maybeMeetFoe();
    this.poseGateSentries(time);
    aimArrow(this);
  }

  poseGateSentries(time) {
    if (this.gateFalling || !this.gateSentries) return;
    for (const man of this.gateSentries) {
      const wave = Math.sin(time / 260 + man.phase);
      const squat = (Math.sin(time / 210 + man.phase) + 1) / 2;
      man.sprite.setPosition(Math.round(man.x + wave * 1.6), Math.round(man.y + squat * 2));
      man.sprite.setAngle(wave * 3.2);
      man.sprite.setScale(1 + squat * 0.05, 1 - squat * 0.07);
      man.shadow.setPosition(man.sprite.x + 3, man.y + 2);
    }
  }

  maybeHintRun(moving) {
    if (this.runHintShown || !moving) return;
    this.runHintShown = true;
    this.game.registry.set('runHintShown', true);
    this.game.events.emit('runHint');
  }

  // No sentries exist until the army has come through the gate.
  maybeMeetFoe() {
    if (this.fightCooldown > 0) return;
    const foe = this.relief.nearestFoe(this.feet.x, this.feet.y, 64);
    if (!foe) return;
    this.engagedFoe = foe;
    this.beginFight();
  }

  beginFight(options = {}) {
    const gate = !!options.gate;
    const foeMax = gate ? GATE_HP : FOE_MAX;
    this.fighting = true;
    this.inputLocked = true;
    this.feet.setVelocity(0, 0);
    this.fight = { foeHp: foeMax, gate };
    this.game.events.emit('fightStart', {
      id: gate ? 'gate-captain' : 'trojan',
      name: gate ? 'Gate Captain' : 'Trojan sentry',
      side: 'hero',
      gate,
      heroHp: this.heroHp,
      heroMax: HERO_MAX,
      foeHp: foeMax,
      foeMax,
    });
  }

  // His turn only. A right answer deals that attack's damage. A wrong answer
  // misses, and the sentry still takes the next turn.
  resolveStrike(payload) {
    const fight = this.fight;
    if (!fight || !this.fighting) return;
    const question = fight.question;
    if (!question) return;
    const attack = fight.attack || attackById('light');
    const correct = payload.index === question.answer;
    const damage = correct ? attack.damage : 0;
    fight.foeHp = Math.max(0, fight.foeHp - damage);
    fight.question = null;
    const defeated = fight.foeHp <= 0;
    const fallen = fight.gate ? 'The captain falls.' : 'The sentry falls.';
    const note = correct ? `${attack.label} lands for ${damage}.` : 'The blow misses.';
    const anim = correct ? attack.anim : 'whiff';
    this.game.events.emit('fightBlow', {
      anim,
      damage,
      hit: correct,
      heroHp: this.heroHp,
      foeHp: fight.foeHp,
      note,
      defeated,
    });
    const wait = BLOW_MS[anim] || 700;
    this.time.delayedCall(wait, () => {
      if (!this.fighting) return;
      if (defeated) {
        this.game.events.emit('fightBlow', {
          anim: 'defeat',
          damage: 0,
          hit: true,
          heroHp: this.heroHp,
          foeHp: 0,
          note: fallen,
          defeated: true,
        });
        this.time.delayedCall(BLOW_MS.defeat, () => {
          if (this.fighting) this.endFight(true, fallen);
        });
        return;
      }
      this.game.events.emit('fightTurn', {
        side: 'enemy',
        heroHp: this.heroHp,
        foeHp: fight.foeHp,
        note,
      });
    });
  }

  enemyAct() {
    const fight = this.fight;
    if (!fight || !this.fighting) return;
    const nextHp = Math.max(0, this.heroHp - FOE_HIT);
    const down = nextHp <= 0;
    this.heroHp = down ? HERO_MAX : nextHp;
    this.heroHpStay();
    this.game.events.emit('fightBlow', {
      anim: 'counter',
      damage: FOE_HIT,
      hit: true,
      heroHp: down ? 0 : this.heroHp,
      foeHp: fight.foeHp,
      note: `${fight.gate ? 'The captain' : 'The sentry'} strikes for ${FOE_HIT}.`,
      defeated: false,
    });
    this.time.delayedCall(BLOW_MS.counter, () => {
      if (!this.fighting) return;
      if (down) {
        const note = fight.gate
          ? 'You fall back. The gate stays shut.'
          : 'You fall back. The sentry recovers.';
        this.endFight(false, note);
        return;
      }
      this.game.events.emit('fightTurn', {
        side: 'hero',
        heroHp: this.heroHp,
        foeHp: fight.foeHp,
        note: `${fight.gate ? 'The captain' : 'The sentry'} strikes for ${FOE_HIT}.`,
      });
    });
  }

  heroHpStay() {
    this.game.registry.set('heroHp', this.heroHp);
  }

  endFight(won, note) {
    const gate = this.fight && this.fight.gate;
    const foe = this.engagedFoe;
    this.engagedFoe = null;
    this.fighting = false;
    this.fight = null;
    this.game.events.emit('fightEnd', { won, note, gate: !!gate });
    if (gate) {
      if (won) {
        this.playGateVictory();
        return;
      }
      this.inputLocked = false;
      return;
    }
    this.fightCooldown = 1.2;
    this.inputLocked = false;
    if (won) this.relief.retire(foe);
    else this.relief.separate(foe, this.feet);
    if (won && this.relief.phase() === 'foes' && this.relief.foeCount() === 0) {
      this.game.events.emit('levelComplete');
    }
  }

  // The doors stay shut until the Gate Captain is beaten.
  playGateVictory() {
    if (this.questDone) return;
    this.questDone = true;
    this.gateFalling = true;
    this.inputLocked = true;
    this.feet.setVelocity(0, 0);
    this.game.registry.set('gateOpen', true);
    this.game.events.emit('questDone');
    if (this.prompt) this.prompt.setVisible(false);
    playGateFall(this, () => {
      this.game.events.emit('levelComplete');
    });
  }

  // A straight knockback can land inside a house or past the map. Step back
  // toward the sentry until the feet box is on open ground, and stay far
  // enough that the same sentry does not grab him again on the next frame.
  clearLanding(x, y, foeX, foeY, safeX, safeY) {
    const dx = foeX - x;
    const dy = foeY - y;
    const len = Math.hypot(dx, dy) || 1;
    const spots = [[x, y]];
    for (let step = 16; step <= 160; step += 16) {
      spots.push([x + (dx / len) * step, y + (dy / len) * step]);
    }
    for (const [px, py] of spots) {
      if (Math.hypot(px - foeX, py - foeY) < 56) continue;
      if (this.standsClear(px, py)) return { x: px, y: py };
    }
    if (this.standsClear(safeX, safeY)) return { x: safeX, y: safeY };
    return { x: foeX, y: Math.min(MAP_H - 16, foeY + 64) };
  }

  standsClear(x, y) {
    const hw = this.feet.body.halfWidth;
    const hh = this.feet.body.halfHeight;
    if (x - hw < 2 || y - hh < 2 || x + hw > MAP_W - 2 || y + hh > MAP_H - 2) return false;
    const corners = [
      [x - hw + 1, y - hh + 1],
      [x + hw - 1, y - hh + 1],
      [x - hw + 1, y + hh - 1],
      [x + hw - 1, y + hh - 1],
    ];
    for (const [sx, sy] of corners) {
      const tile = this.ground.getTileAtWorldXY(sx, sy);
      if (tile && tile.collides) return false;
    }
    this.feet.setPosition(x, y);
    this.feet.body.reset(x, y);
    return !this.physics.overlap(this.feet, this.blockers);
  }
}

// "Press E" floats over his head. The camera is zoomed 3×, so the letters
// are drawn at 15px and then shrunk to 1/3. 15 × (1/3) × 3 = 15 screen
// pixels, which keeps the letters sharp instead of blurry.
function aimArrow(scene) {
  const canvas = scene.game.canvas;
  const host = canvas?.parentElement?.parentElement;
  if (!host) return;
  let arrow = document.getElementById('gate-arrow');
  if (!arrow) {
    arrow = document.createElement('div');
    arrow.id = 'gate-arrow';
    arrow.innerHTML = '<svg viewBox="0 0 64 64" width="84" height="84" aria-hidden="true"><polygon points="4,10 58,32 4,54 18,32" fill="#f0d48a" stroke="#1a1208" stroke-width="3" stroke-linejoin="round"/></svg>';
    host.appendChild(arrow);
  }
  if (scene.questDone || scene.nearest?.id === 'gate') {
    arrow.style.display = 'none';
    return;
  }
  const gate = GATE_MARK;
  const cam = scene.cameras.main;
  // Screen position of the door center. midPoint is where the camera is looking.
  const sx = cam.width * 0.5 + (gate.x - cam.midPoint.x) * cam.zoom;
  const sy = cam.height * 0.5 + (gate.y - cam.midPoint.y) * cam.zoom;
  const hostBox = host.getBoundingClientRect();
  const canvasBox = canvas.getBoundingClientRect();
  const ox = canvasBox.left - hostBox.left;
  const oy = canvasBox.top - hostBox.top;
  const w = cam.width;
  const h = cam.height;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const dx = sx - cx;
  const dy = sy - cy;
  const onScreen = sx > 40 && sy > 40 && sx < w - 40 && sy < h - 40;
  let x;
  let y;
  const nearGate = onScreen && Math.hypot(dx, dy) < 220;
  if (nearGate) {
    // Above his head, still aimed down at the doors, so it does not cover him.
    x = sx;
    y = Math.max(78, sy - 280);
  } else if (onScreen) {
    const len = Math.hypot(dx, dy) || 1;
    x = sx - (dx / len) * 130;
    y = sy - (dy / len) * 130;
  } else {
    const hw = Math.max(72, cx - 96);
    const hh = Math.max(72, cy - 220);
    const scale = Math.min(hw / Math.abs(dx || 0.001), hh / Math.abs(dy || 0.001));
    x = cx + dx * scale;
    y = cy + dy * scale;
  }
  const angle = nearGate
    ? Math.PI / 2
    : Math.atan2((sy + oy) - (y + oy), (sx + ox) - (x + ox));
  arrow.style.display = 'block';
  arrow.style.transform = `translate(${Math.round(x + ox)}px, ${Math.round(y + oy)}px) rotate(${angle}rad)`;
}

function makePrompt(scene) {
  const label = scene.add.text(0, 0, 'Press E', {
    fontFamily: 'monospace',
    fontSize: '15px',
    color: '#f6ead2',
    stroke: '#000000',
    strokeThickness: 4,
  });
  label.setScale(1 / 3);
  label.setOrigin(0.5, 1);
  label.setVisible(false);
  return label;
}

// The spot whose circle contains his feet, picking the closest if two overlap.
function nearestInteractable(x, y, scene) {
  let best = null;
  let bestDist = Infinity;
  for (const spot of INTERACTABLES) {
    if (spot.id === 'horse_hatch' && scene.game.registry.get('leftHorse')) continue;
    if (spot.id === 'gate' && scene.questDone) continue;
    const radius = spot.radius ?? INTERACT_RADIUS;
    const dist = Math.hypot(spot.x - x, spot.y - y);
    if (dist <= radius && dist < bestDist) {
      best = spot;
      bestDist = dist;
    }
  }
  return best;
}

// The playtest reads window.__troy. It is not shown on screen.
function publishDebug(scene) {
  const { feet, hero } = scene;
  globalThis.__troy = {
    owner: scene,
    ready: true,
    get x() { return feet.x; },
    get y() { return feet.y; },
    get frame() { return Number(hero.frame.name); },
    get scaleY() { return hero.scaleY; },
    get facing() { return scene.facing; },
    get interactable() { return scene.nearest; },
    get inputLocked() { return scene.inputLocked; },
    get texture() { return hero.texture.key; },
    get anim() { return hero.anims.currentAnim ? hero.anims.currentAnim.key : ''; },
    get feetBox() {
      return { w: feet.body.width, h: feet.body.height };
    },
    blocked() {
      const b = feet.body.blocked;
      return { up: b.up, down: b.down, left: b.left, right: b.right };
    },
    teleport(x, y) {
      feet.setPosition(x, y);
      feet.body.reset(x, y);
    },
    sentries() {
      return scene.relief.foeCount();
    },
    startFight() {
      scene.beginFight();
    },
    greeks() {
      return scene.relief.greekCount();
    },
    get reliefPhase() {
      return scene.relief.phase();
    },
    lookAt(x, y, zoom) {
      const cam = scene.cameras.main;
      cam.stopFollow();
      cam.setZoom(zoom);
      cam.centerOn(x, y);
    },
  };
}

// Shows the idle frame, or a walk cycle once ANIM_CONFIG.walk is set.
// Returns a small upward nudge (negative y) used as the fake footstep.
function poseHero(hero, facing, moving, time) {
  const idle = ANIM_CONFIG.facingFrames[facing];

  if (ANIM_CONFIG.walk) {
    if (moving) {
      hero.anims.play(`walk-${facing}`, true);
    } else {
      hero.anims.stop();
      hero.setTexture(ANIM_CONFIG.textureKey, idle);
    }
    hero.setOrigin(0.5, 1);
    hero.setScale(HERO_SCALE, HERO_SCALE);
    return 0;
  }

  hero.setFrame(idle);
  if (!moving) {
    hero.setScale(1, 1);
    return 0;
  }

  const hop = Math.abs(Math.sin(time / 110));
  hero.setScale(1 + hop * 0.04, 1 - hop * 0.07);
  return -hop * 1.7;
}

function clampToMap(feet) {
  const body = feet.body;
  if (!body) return;
  const x = Math.min(MAP_W - body.halfWidth, Math.max(body.halfWidth, feet.x));
  const y = Math.min(MAP_H - body.halfHeight, Math.max(body.halfHeight, feet.y));
  if (x === feet.x && y === feet.y) return;
  feet.setPosition(x, y);
  body.reset(x, y);
}

function addRect(scene, group, x, y, w, h) {
  const blocker = group.create(x + w / 2, y + h / 2, 'blank');
  blocker.setDisplaySize(w, h);
  blocker.refreshBody();
  blocker.setVisible(false);
  return blocker;
}

function addGateSentries(scene) {
  const key = WARRIOR_CONFIG.teams.trojan.key;
  const tex = scene.textures.get(key);
  if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  const frame = WARRIOR_CONFIG.facingFrames.s;
  const spots = [
    { x: 438, y: 642 },
    { x: 466, y: 648 },
    { x: 494, y: 648 },
    { x: 522, y: 642 },
  ];
  scene.gateSentries = spots.map((spot, index) => {
    const shadow = scene.add.ellipse(spot.x + 3, spot.y + 1, 14, 5, 0x0c1424, 0.55);
    const sprite = scene.add.sprite(spot.x, spot.y, key, frame).setOrigin(0.5, 1);
    const depth = 7692 + index;
    shadow.setDepth(depth - 2);
    sprite.setDepth(depth);
    return { ...spot, sprite, shadow, phase: index * 0.8 };
  });
}

// Doors crash outward, the brace is thrown clear, and a Greek rank surges
// through. About four seconds, then the Level 1 card. Input stays locked.
function playGateFall(scene, onDone) {
  const cam = scene.cameras.main;
  cam.stopFollow();
  cam.pan(480, 636, 320, 'Sine.easeOut');
  cam.shake(260, 0.008);
  openGateDoors(scene);
  throwGateSentries(scene);
  surgeArmy(scene);

  const flash = scene.add.rectangle(0, 0, cam.width, cam.height, 0xfff6e0, 1)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(20000)
    .setAlpha(0);
  scene.tweens.add({
    targets: flash,
    delay: 660,
    alpha: 0.42,
    duration: 50,
    yoyo: true,
    hold: 30,
    onComplete: () => flash.destroy(),
  });

  scene.time.delayedCall(2900, () => {
    const cover = scene.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(30000)
      .setAlpha(0);
    cover.setDisplaySize(cam.width, cam.height);
    scene.tweens.add({ targets: cover, alpha: 1, duration: 900 });
    cam.fadeOut(900, 0, 0, 0);
  });
  scene.time.delayedCall(3600, () => {
    if (onDone) onDone();
  });
}

function throwGateSentries(scene) {
  const doorX = scene.gateDoor && scene.gateDoor.sprite ? scene.gateDoor.sprite.x : 480;
  (scene.gateSentries || []).forEach((man, index) => {
    const dir = man.x < doorX ? -1 : 1;
    const fallX = man.x + dir * 22;
    const fallY = man.y - 46;
    scene.tweens.add({
      targets: man.sprite,
      delay: 180 + index * 40,
      duration: 380,
      x: fallX,
      y: fallY,
      angle: dir * 96,
      ease: 'Quad.easeIn',
    });
    scene.tweens.add({
      targets: man.sprite,
      delay: 560 + index * 40,
      duration: 480,
      alpha: 0,
      y: fallY - 10,
      onComplete: () => man.sprite.destroy(),
    });
    scene.tweens.add({
      targets: man.shadow,
      delay: 180 + index * 40,
      duration: 860,
      x: fallX,
      alpha: 0,
      onComplete: () => man.shadow.destroy(),
    });
  });
}

function surgeArmy(scene) {
  const key = WARRIOR_CONFIG.teams.greek.key;
  const tex = scene.textures.get(key);
  if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  const frame = WARRIOR_CONFIG.facingFrames.n;
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const x = 480 + (col - 3) * 42;
      const y = 700 + row * 28;
      const shadow = scene.add.ellipse(x + 3, y + 1, 14, 5, 0x0c1424, 0.5);
      const sprite = scene.add.sprite(x, y, key, frame).setOrigin(0.5, 1);
      const sort = 7700 + y;
      shadow.setDepth(sort - 2);
      sprite.setDepth(sort);
      scene.tweens.add({
        targets: [sprite, shadow],
        delay: 780 + row * 160 + col * 24,
        duration: 1200,
        y: '-=172',
        ease: 'Cubic.easeOut',
      });
    }
  }
}

function openGateDoors(scene) {
  const door = scene.gateDoor;
  if (!door) return;
  const src = door.sprite;
  const x = src ? src.x : 480;
  const y = src ? src.y : 652;
  if (src) src.setVisible(false);
  if (door.blocker) door.blocker.destroy();
  // One picture holds both leaves. Crop each half, then swing them open.
  const left = scene.add.image(x, y, 'gate-door').setOrigin(0.5, 1).setDepth(7420);
  const right = scene.add.image(x, y, 'gate-door').setOrigin(0.5, 1).setDepth(7420);
  left.setCrop(0, 0, 64, 72);
  right.setCrop(64, 0, 64, 72);
  scene.tweens.add({
    targets: left,
    x: x - 74,
    y: y + 26,
    angle: -84,
    duration: 700,
    ease: 'Cubic.easeIn',
  });
  scene.tweens.add({
    targets: right,
    x: x + 74,
    y: y + 26,
    angle: 84,
    duration: 700,
    ease: 'Cubic.easeIn',
    onComplete: () => burstDust(scene, x, y + 6),
  });
  scene.cameras.main.shake(220, 0.006);
}

function burstDust(scene, x, y) {
  for (let i = 0; i < 12; i += 1) {
    const puff = scene.add.circle(
      x + (Math.random() - 0.5) * 90,
      y + (Math.random() - 0.5) * 14,
      1.6 + Math.random() * 1.6,
      i % 3 === 0 ? 0x8a7358 : 0xe6d3b0,
      0.85,
    );
    puff.setDepth(8000);
    scene.tweens.add({
      targets: puff,
      x: puff.x + (Math.random() - 0.5) * 40,
      y: puff.y - 6 - Math.random() * 16,
      alpha: 0,
      scale: 1.6,
      duration: 420 + Math.random() * 280,
      onComplete: () => puff.destroy(),
    });
  }
}


function addSolidProp(scene, group, prop) {
  // Moonlight comes from the upper left, so shadows fall down and to the right.
  const wide = prop.id === 'column' ? 10 : prop.id === 'horse' ? 72 : prop.bodyW * 0.85;
  const tall = prop.id === 'column' ? 4 : prop.id === 'horse' ? 14 : 6;
  const shadow = scene.add.ellipse(prop.x + 5, prop.baseY + 2, wide, tall, 0x1a2438, 0.5);
  // Above the moonlight grade, under the people, so the shadow stays visible.
  shadow.setDepth(5200);
  let sprite = null;
  if (prop.id === 'horse') {
    // Wheels in the south frame end at pixel 122 of 128. Other facings stay loaded.
    const horse = scene.add.sprite(prop.x, prop.baseY, 'horse', 0);
    horse.setOrigin(0.5, 122 / 128);
    horse.setDepth(7000 + prop.baseY);
  } else {
    // Same band as the horse and the people, so a roof covers whoever is behind it.
    sprite = scene.add.image(prop.x, prop.baseY, prop.id).setOrigin(0.5, 1).setDepth(7000 + prop.baseY);
  }
  const bottom = prop.baseY - prop.insetBottom;
  const blocker = group.create(prop.x, bottom - prop.bodyH / 2, 'blank');
  blocker.setDisplaySize(prop.bodyW, prop.bodyH);
  blocker.refreshBody();
  blocker.setVisible(false);
  if (prop.id === 'gate-door') scene.gateDoor = { sprite, blocker };
}

function addLamp(scene, group, lamp) {
  const { x, y } = lamp;
  // Flame sits at the top of the 28px lamp. The pool is centred there.
  const flameY = y - 24;
  const glow = scene.add.image(x, flameY, 'lamp-glow');
  glow.setBlendMode(Phaser.BlendModes.ADD);
  glow.setDepth(5400);
  glow.setAlpha(0.62);
  glow.setScale(0.78);
  const sprite = scene.add.sprite(x, y, 'oil-lamp', 0).setOrigin(0.5, 1);
  sprite.setDepth(7000 + y);
  sprite.play('lamp-flicker');
  scene.tweens.add({
    targets: glow,
    alpha: 0.4,
    duration: 480,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  const blocker = group.create(x, y - 4, 'blank');
  blocker.setDisplaySize(10, 8);
  blocker.refreshBody();
  blocker.setVisible(false);
}

function createGlints(scene) {
  const glints = [];
  for (let i = 0; i < 8; i += 1) {
    const glint = scene.add.ellipse(
      Math.random() * MAP_W,
      MAP_H - 160 + Math.random() * 80,
      16 + Math.random() * 20,
      3,
      0xb7dbe8,
      0.35,
    );
    glint.setDepth(2);
    glint.speed = 12 + Math.random() * 16;
    glints.push(glint);
  }
  return glints;
}
