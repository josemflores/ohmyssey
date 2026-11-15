// Level 2: Ithaca at night. Odysseus wakes on the beach where the
// Phaeacians left him and walks home: the cove, the olive hills, the
// swineherd's hut, the town, the dark lighthouse, the palace.
//
// Movement works like Troy: an invisible 16×10 box is his feet and slides
// on long wall rectangles; the picture is drawn above it and y-sorted.

import Phaser from 'phaser';
import { loadHeroActions, createHeroActions } from '../heroAnimations.js';
import { ANIM_CONFIG, facingFromVector } from '../animConfig.js';
import { RUN_SPEED, WALK_SPEED } from '../patrol.js';
import { buildWorldTextures } from '../textures.js';
import { buildLevel2Textures, propTexture } from './art.js';
import { COURTYARD_RETURN, HALL_DOOR_SPOT, buildHall, preloadHall } from './hall.js';
import { HALL, HALL_SPAWN, HALL_SPOTS } from './hallMap.js';
import {
  DECOR,
  FEET,
  LAMPS,
  MAP_H,
  MAP_W,
  PENELOPE,
  PROPS,
  SPAWN,
  SPOTS,
  buildLevel2Map,
  level2LayoutReport,
  penelopeRect,
  propRect,
  solidRects,
} from './map.js';

const HERO_SCALE = 4 / 3;
const SORT = 7000;
const FACINGS = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
// Odyssey 13: he wakes on Ithaca, and Athena hides him as a beggar.
const DISGUISE = [
  { who: 'Odysseus', line: 'What shore is this? They set me here while I slept.' },
  { who: 'Athena', line: 'It is Ithaca, cloaked in mist. Suitors fill your house.', appear: true },
  { who: 'Athena', line: 'I will disguise you, so the suitors will not know you.' },
  { who: 'Athena', line: 'Go as a beggar. The hour to reveal yourself will come.', shimmer: true },
];
// Odyssey 14–16: the swineherd's hut, the son's return, the reveal.
const HUT = [
  { who: 'Eumaeus', line: 'Sit, stranger. A beggar is welcome by this fire.' },
  { who: 'Eumaeus', line: 'The suitors eat my master\'s best hogs, and the house goes hungry.' },
  { who: 'Telemachus', line: 'Eumaeus, I am home from Pylos. Who is this ragged man?', arrive: true },
  { who: 'Eumaeus', line: 'A wanderer, my prince. He asks after your father.' },
  { who: 'Athena', line: 'You are alone now. Let your son see his father.', appear: true },
  { who: 'Odysseus', line: 'Telemachus, I am your father. Athena hid me in these rags.', reveal: true },
  { who: 'Telemachus', line: 'Father? After twenty years, you stand in this hut.' },
  { who: 'Odysseus', line: 'We take the palace together. Tell no one until I say.', conceal: true },
];
const EUMAEUS_AT = { x: 248, y: 508 };
const SON_FROM = { x: 360, y: 516 };
const SON_AT = { x: 190, y: 556 };
// Props are drawn above the moonlight grade (so they y-sort with him), so
// they take the moon as a tint instead. Lit windows keep a little warmth.
const MOON_TINT = 0x8a9cc4;

export class Level2Scene extends Phaser.Scene {
  constructor() {
    super('level2');
    this.facing = 'n';
    this.nearId = '';
  }

  preload() {
    loadHeroActions(this);
    preloadHall(this);
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
    if (!this.textures.exists('lighthouse-unlit')) {
      this.load.image('lighthouse-unlit', '/assets/props/lighthouse_unlit.png');
    }
    if (!this.textures.exists('penelope')) {
      this.load.spritesheet('penelope', '/assets/sprites/npcs/penelope/penelope_sheet.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
    }
    if (!this.textures.exists('odysseus-beggar')) {
      this.load.spritesheet('odysseus-beggar', '/assets/sprites/odysseus_beggar/idle.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
    }
    if (!this.textures.exists('odysseus-beggar-walk')) {
      this.load.spritesheet('odysseus-beggar-walk', '/assets/sprites/odysseus_beggar/walk.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
    }
    if (!this.textures.exists('odysseus-beggar-idle')) {
      this.load.spritesheet('odysseus-beggar-idle', '/assets/sprites/odysseus_beggar/idle_animation.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
    }
    if (!this.textures.exists('eumaeus')) {
      this.load.spritesheet('eumaeus', '/assets/sprites/npcs/eumaeus/eumaeus_32.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
    }
    if (!this.textures.exists('telemachus')) {
      this.load.spritesheet('telemachus', '/assets/sprites/npcs/telemachus/telemachus_32.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
    }
  }

  create() {
    createHeroActions(this);
    const report = level2LayoutReport();
    if (!report.ok) console.warn(`Level 2 layout problem:\n${report.problems.join('\n')}`);

    // Troy's shared pieces: blank boxes, feet, lamp, lamp glow, vignette.
    if (!this.textures.exists('oil-lamp')) buildWorldTextures(this);
    buildLevel2Textures(this);
    for (const key of ['lighthouse-unlit', 'penelope', 'eumaeus', 'telemachus', ANIM_CONFIG.textureKey, 'odysseus-walk', 'odysseus-beggar', 'odysseus-beggar-walk', 'odysseus-beggar-idle']) {
      if (this.textures.exists(key)) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.createAnims();

    // Ground.
    const grid = buildLevel2Map();
    const map = this.make.tilemap({ data: grid, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage('l2-tiles');
    map.createLayer(0, tiles, 0, 0).setDepth(0);

    // Solids: tile rectangles, prop footprints, lamps, Penelope.
    this.blockers = this.physics.add.staticGroup();
    for (const rect of solidRects(grid)) addRect(this.blockers, rect);
    for (const prop of PROPS) {
      addProp(this, prop);
      addRect(this.blockers, propRect(prop));
    }
    for (const decor of DECOR) addDecor(this, decor);
    this.addPenelope();
    this.addSwineherd();
    addRect(this.blockers, penelopeRect());
    // The great hall, built east of the island (hall.js). He walks in
    // through its doors once he answers the question at them.
    buildHall(this, this.blockers);
    this.area = ISLAND;

    this.glints = createGlints(this);
    this.fireflies = createFireflies(this);

    // Moonlight: a cool multiply over the warm ground. Lamps, people and
    // their shadows are drawn above it.
    const moon = this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x66789c, 1);
    moon.setBlendMode(Phaser.BlendModes.MULTIPLY);
    moon.setDepth(5000);
    // A faint cool sheen on the open sea and the headland.
    for (const [x, y, s] of [[560, 860, 2.6], [960, 520, 2.2]]) {
      this.add.image(x, y, 'l2-moonglow').setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(5100).setAlpha(0.35).setScale(s);
    }
    for (const lamp of LAMPS) addLamp(this, this.blockers, lamp);

    this.vignette = this.add.image(0, 0, 'vignette').setOrigin(0, 0).setScrollFactor(0)
      .setDepth(15000).setAlpha(0.62);

    // Feet are the body.
    this.feet = this.physics.add.image(SPAWN.x, SPAWN.y, 'feet');
    this.feet.setVisible(false);
    this.feet.body.setSize(FEET.w, FEET.h, true);
    this.feet.setCollideWorldBounds(true);
    this.feet.body.setAllowGravity(false);
    this.feet.setBounce(0);
    this.feet.setDrag(0, 0);
    this.feet.body.pushable = false;
    this.feet.body.setMaxVelocity(RUN_SPEED, RUN_SPEED);
    this.physics.world.setBounds(0, 0, HALL.x + HALL.w, Math.max(MAP_H, HALL.y + HALL.h));
    // Same biases as Troy: deep enough that a slow frame cannot tunnel
    // and a wall cannot swallow his feet.
    this.physics.world.TILE_BIAS = 32;
    this.physics.world.OVERLAP_BIAS = 24;
    this.physics.add.collider(this.feet, this.blockers);

    // His picture. A pale rim keeps him readable against dark ground.
    const idle = ANIM_CONFIG.facingFrames.n;
    this.heroShadow = this.add.ellipse(SPAWN.x, SPAWN.y, 24, 7, 0x0c1424, 0.55);
    this.heroRim = this.add.sprite(SPAWN.x, SPAWN.y, ANIM_CONFIG.textureKey, idle)
      .setOrigin(0.5, 1).setTint(0xd0e6ff).setScale(HERO_SCALE * 1.07);
    this.hero = this.add.sprite(SPAWN.x, SPAWN.y, ANIM_CONFIG.textureKey, idle)
      .setOrigin(0.5, 1).setScale(HERO_SCALE);

    this.prompt = makePrompt(this);
    this.inputLocked = true;
    this.disguised = false;
    this.inDisguise = true;
    this.disguiseIndex = 0;

    const cam = this.cameras.main;
    cam.roundPixels = true;
    cam.setBounds(ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h);
    cam.startFollow(this.feet, true, 0.14, 0.14);
    cam.fadeIn(900, 6, 10, 18);
    const fit = () => {
      fitCamera(this);
      this.vignette.setDisplaySize(this.scale.width, this.scale.height);
    };
    fit();
    this.scale.on('resize', fit);

    this.keys = this.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
      arrowUp: 'UP', arrowDown: 'DOWN', arrowLeft: 'LEFT', arrowRight: 'RIGHT',
      keyE: 'E', shift: 'SHIFT',
    });
    this.input.keyboard.addCapture(['W', 'A', 'S', 'D', 'E', 'SHIFT', 'UP', 'DOWN', 'LEFT', 'RIGHT']);

    const onLock = () => {
      this.inputLocked = true;
      this.feet.setVelocity(0, 0);
    };
    const onUnlock = () => {
      this.keys.keyE.reset();
      if (this.inDisguise) {
        this.advanceDisguise();
        return;
      }
      if (this.inHut) {
        this.advanceHut();
        return;
      }
      this.inputLocked = false;
    };
    this.game.events.on('lockInput', onLock);
    this.game.events.on('unlockInput', onUnlock);
    const onHallOpen = () => this.enterHall();
    this.game.events.on('hallOpen', onHallOpen);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('lockInput', onLock);
      this.game.events.off('unlockInput', onUnlock);
      this.game.events.off('hallOpen', onHallOpen);
      this.scale.off('resize', fit);
      if (globalThis.__level2?.owner === this) delete globalThis.__level2;
    });

    publishDebug(this);
    this.game.events.emit('level2Ready');
    this.time.delayedCall(1100, () => this.advanceDisguise());
  }

  advanceDisguise() {
    if (!this.inDisguise) return;
    if (this.disguiseIndex >= DISGUISE.length) {
      this.inDisguise = false;
      this.hideAthena();
      this.inputLocked = false;
      this.game.events.emit('objective', {
        title: 'Find shelter with Eumaeus the swineherd',
        note: 'His hut is west of the town, by the pig pen.',
      });
      return;
    }
    const beat = DISGUISE[this.disguiseIndex];
    this.disguiseIndex += 1;
    const show = () => {
      if (beat.appear) this.showAthena();
      this.inputLocked = true;
      this.feet.setVelocity(0, 0);
      this.game.events.emit('talk', { who: beat.who, line: beat.line });
    };
    if (beat.shimmer) this.playShimmer(show);
    else show();
  }

  showAthena() {
    if (this.athenaGlow) return;
    this.athenaGlow = this.add.ellipse(this.hero.x + 34, this.hero.y - 24, 16, 36, 0xf0d48a, 0.55);
    this.athenaGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.athenaGlow.setDepth(12000);
    this.tweens.add({
      targets: this.athenaGlow,
      alpha: 0.2,
      scaleY: 1.12,
      yoyo: true,
      repeat: -1,
      duration: 620,
    });
  }

  hideAthena() {
    if (!this.athenaGlow) return;
    this.athenaGlow.destroy();
    this.athenaGlow = null;
  }

  playShimmer(done) {
    this.becomeBeggar();
    this.cameras.main.flash(380, 255, 236, 190);
    const ring = this.add.circle(this.hero.x, this.hero.y - 18, 6, 0xfff1c4, 0.9);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    ring.setDepth(this.hero.depth + 6);
    this.tweens.add({
      targets: ring,
      scale: 8,
      alpha: 0,
      duration: 460,
      onComplete: () => {
        ring.destroy();
        done();
      },
    });
  }

  becomeBeggar() {
    this.disguised = true;
    poseHero(this, this.facing, false);
  }

  showKing() {
    this.disguised = false;
    poseHero(this, this.facing, false);
  }

  advanceHut() {
    if (!this.inHut) return;
    if (this.hutIndex >= HUT.length) {
      this.inHut = false;
      this.hutDone = true;
      this.hideAthena();
      this.inputLocked = false;
      this.game.events.emit('objective', {
        title: 'Go to the palace',
        note: 'The road north leads up to the hall.',
      });
      return;
    }
    const beat = HUT[this.hutIndex];
    this.hutIndex += 1;
    const show = () => {
      if (beat.appear) this.showAthena();
      if (beat.arrive) this.arriveSon();
      this.inputLocked = true;
      this.feet.setVelocity(0, 0);
      this.game.events.emit('talk', { who: beat.who, line: beat.line });
    };
    if (beat.arrive) {
      this.arriveSon();
      this.time.delayedCall(700, show);
      return;
    }
    if (beat.reveal) {
      this.flashForm(false, show);
      return;
    }
    if (beat.conceal) {
      this.flashForm(true, show);
      return;
    }
    show();
  }

  arriveSon() {
    if (!this.telemachus || this.sonHere) return;
    this.sonHere = true;
    this.telemachus.setVisible(true);
    this.sonShadow.setVisible(true);
    this.tweens.add({
      targets: this.telemachus,
      x: SON_AT.x,
      duration: 680,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: this.sonShadow,
      x: SON_AT.x + 3,
      duration: 680,
      ease: 'Sine.easeOut',
    });
  }

  flashForm(asBeggar, done) {
    if (asBeggar) this.becomeBeggar();
    else this.showKing();
    this.cameras.main.flash(320, 255, 236, 190);
    const ring = this.add.circle(this.hero.x, this.hero.y - 18, 6, 0xfff1c4, 0.9);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    ring.setDepth(this.hero.depth + 6);
    this.tweens.add({
      targets: ring,
      scale: 7,
      alpha: 0,
      duration: 420,
      onComplete: () => {
        ring.destroy();
        done();
      },
    });
  }

  addSwineherd() {
    const depth = SORT + EUMAEUS_AT.y;
    this.add.ellipse(EUMAEUS_AT.x + 3, EUMAEUS_AT.y + 1, 18, 6, 0x0c1424, 0.5).setDepth(5200);
    this.eumaeus = this.add.sprite(EUMAEUS_AT.x, EUMAEUS_AT.y, 'eumaeus', 0)
      .setOrigin(0.5, 1).setScale(HERO_SCALE).setDepth(depth);
    this.eumaeus.play('eumaeus-idle');
    this.sonShadow = this.add.ellipse(SON_FROM.x + 3, SON_FROM.y + 1, 16, 5, 0x0c1424, 0.5)
      .setDepth(5200).setVisible(false);
    this.telemachus = this.add.sprite(SON_FROM.x, SON_FROM.y, 'telemachus', 0)
      .setOrigin(0.5, 1).setScale(HERO_SCALE).setDepth(SORT + SON_AT.y).setVisible(false);
    this.telemachus.play('telemachus-idle');
  }

  createAnims() {
    const walk = ANIM_CONFIG.walk;
    if (walk && !this.anims.exists('walk-s')) {
      ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'].forEach((dir, row) => {
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
    FACINGS.forEach((dir, row) => {
      const walkKey = `beggar-walk-${dir}`;
      if (!this.anims.exists(walkKey)) {
        this.anims.create({
          key: walkKey,
          frames: this.anims.generateFrameNumbers('odysseus-beggar-walk', {
            start: row * 8,
            end: row * 8 + 7,
          }),
          frameRate: 10,
          repeat: -1,
        });
      }
      const idleKey = `beggar-idle-${dir}`;
      if (!this.anims.exists(idleKey)) {
        this.anims.create({
          key: idleKey,
          frames: this.anims.generateFrameNumbers('odysseus-beggar-idle', {
            start: row * 2,
            end: row * 2 + 1,
          }),
          frameRate: 2,
          repeat: -1,
        });
      }
    });
    if (!this.anims.exists('lamp-flicker')) {
      this.anims.create({
        key: 'lamp-flicker',
        frames: this.anims.generateFrameNumbers('oil-lamp', { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1,
      });
    }
    if (!this.anims.exists('eumaeus-idle')) {
      this.anims.create({
        key: 'eumaeus-idle',
        frames: this.anims.generateFrameNumbers('eumaeus', { start: 0, end: 3 }),
        frameRate: 3,
        repeat: -1,
      });
    }
    if (!this.anims.exists('telemachus-idle')) {
      this.anims.create({
        key: 'telemachus-idle',
        frames: this.anims.generateFrameNumbers('telemachus', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
      });
    }
    if (!this.anims.exists('penelope-idle')) {
      this.anims.create({
        key: 'penelope-idle',
        frames: this.anims.generateFrameNumbers('penelope', { start: 0, end: 3 }),
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  addPenelope() {
    const { x, y } = PENELOPE;
    const shadow = this.add.ellipse(x + 3, y + 1, 18, 6, 0x0c1424, 0.5);
    shadow.setDepth(5200);
    const sprite = this.add.sprite(x, y + 1, 'penelope', 0).setOrigin(0.5, 1).setScale(HERO_SCALE);
    sprite.setDepth(SORT + y);
    sprite.setTint(0xc4d0ea);
    sprite.play('penelope-idle');
    this.penelope = sprite;
  }

  // Walk into the hall: fade, step through the doors, fade back in.
  enterHall() {
    this.inputLocked = true;
    this.feet.setVelocity(0, 0);
    this.moveTo(HALL_AREA, HALL_SPAWN, 'n', () => {
      this.inHall = true;
      this.game.events.emit('objective', {
        title: 'The hall of Odysseus',
        note: 'The suitors feast in your hall. Look for the great bow.',
      });
    });
  }

  leaveHall() {
    this.inputLocked = true;
    this.feet.setVelocity(0, 0);
    this.moveTo(ISLAND, COURTYARD_RETURN, 's', () => { this.inHall = false; });
  }

  moveTo(area, at, facing, done) {
    const cam = this.cameras.main;
    cam.fadeOut(320, 6, 10, 18);
    cam.once('camerafadeoutcomplete', () => {
      this.area = area;
      this.feet.setPosition(at.x, at.y);
      this.feet.body.reset(at.x, at.y);
      this.facing = facing;
      cam.setBounds(area.x, area.y, area.w, area.h);
      fitCamera(this);
      cam.centerOn(at.x, at.y);
      cam.fadeIn(420, 6, 10, 18);
      this.inputLocked = false;
      this.keys.keyE.reset();
      if (done) done();
    });
  }

  update(time, delta) {
    clampToMap(this.feet, this.area);
    const locked = this.inputLocked;
    const k = this.keys;
    let vx = 0;
    let vy = 0;
    if (!locked) {
      if (k.left.isDown || k.arrowLeft.isDown) vx -= 1;
      if (k.right.isDown || k.arrowRight.isDown) vx += 1;
      if (k.up.isDown || k.arrowUp.isDown) vy -= 1;
      if (k.down.isDown || k.arrowDown.isDown) vy += 1;
    }
    if (vx === 0 && vy === 0) {
      this.feet.setVelocity(0, 0);
    } else {
      const len = Math.hypot(vx, vy);
      const speed = k.shift.isDown ? RUN_SPEED : WALK_SPEED;
      this.feet.setVelocity((vx / len) * speed, (vy / len) * speed);
      this.facing = facingFromVector(vx, vy);
    }

    const moving = this.feet.body.speed > 8;
    const groundY = this.feet.y + this.feet.body.halfHeight;
    const hx = Math.round(this.feet.x);
    const hy = Math.round(groundY);
    poseHero(this, this.facing, moving);
    this.hero.setPosition(hx, hy);
    this.heroRim.setTexture(this.hero.texture.key, this.hero.frame.name);
    this.heroRim.setPosition(hx, hy);
    this.heroShadow.setPosition(hx + 4, hy + 1);
    const sort = SORT + groundY;
    this.heroShadow.setDepth(5200);
    this.heroRim.setDepth(sort - 0.5);
    this.hero.setDepth(sort);

    // Penelope turns to face him when he comes close.
    if (this.penelope) {
      const dx = this.feet.x - PENELOPE.x;
      const dy = groundY - PENELOPE.y;
      const close = Math.hypot(dx, dy) < 72;
      const row = close ? facingRow(facingFromVector(dx, dy)) : 0;
      if (row !== this.penelopeRow) {
        this.penelopeRow = row;
        this.penelope.anims.stop();
        this.penelope.setFrame(row * 4);
        if (row === 0) this.penelope.play('penelope-idle');
      }
    }

    this.nearest = locked ? null : nearestSpot(this.feet.x, groundY);
    if (this.nearest) {
      this.prompt.setText('Press E');
      this.prompt.setVisible(true);
      this.prompt.setPosition(hx, hy - 50);
      this.prompt.setDepth(sort + 4);
    } else {
      this.prompt.setVisible(false);
    }
    const nearId = this.nearest ? this.nearest.id : '';
    if (nearId !== this.nearId) {
      this.nearId = nearId;
      this.game.events.emit('near', this.nearest);
    }
    if (!locked && this.nearest && Phaser.Input.Keyboard.JustDown(k.keyE)) {
      this.inputLocked = true;
      this.feet.setVelocity(0, 0);
      if (this.nearest.id === 'hall-door') {
        // The doors ask a question once he has been to Eumaeus (Level2World
        // shows it; a right answer comes back as 'hallOpen').
        if (this.hutDone) {
          this.game.events.emit('hallDoor');
        } else {
          this.game.events.emit('talk', {
            id: 'hall-door',
            who: 'The hall doors',
            line: 'The doors are shut, and the suitors would mock a stranger. Find shelter with Eumaeus first.',
          });
        }
      } else if (this.nearest.id === 'hall-exit') {
        this.leaveHall();
      } else if (this.nearest.id === 'hut' && !this.hutDone && !this.inHut) {
        this.inHut = true;
        this.hutIndex = 0;
        this.advanceHut();
      } else {
        this.game.events.emit('talk', { id: this.nearest.id, who: this.nearest.who, line: this.nearest.line });
      }
    }

    animateGlints(this.glints, delta);
    animateFireflies(this.fireflies, time);
  }
}

// ---- Helpers ---------------------------------------------------------------

const FACING_ROWS = { s: 0, se: 1, e: 2, ne: 3, n: 4, nw: 5, w: 6, sw: 7 };
function facingRow(facing) {
  return FACING_ROWS[facing] ?? 0;
}

function poseHero(scene, facing, moving) {
  const hero = scene.hero;
  if (scene.disguised) {
    hero.anims.play(moving ? `beggar-walk-${facing}` : `beggar-idle-${facing}`, true);
    return;
  }
  if (ANIM_CONFIG.walk && moving) {
    hero.anims.play(`walk-${facing}`, true);
  } else {
    hero.anims.play(`hero-idle-${facing}`, true);
  }
}

// Whole-number zoom, at least 3×. On a very wide screen the zoom rises
// until the island fills the view, so no empty page shows past the edge.
// The island, and the hall to its east. The camera and his feet stay
// inside whichever one he is in.
const ISLAND = { x: 0, y: 0, w: MAP_W, h: MAP_H };
const HALL_AREA = { x: HALL.x, y: HALL.y, w: HALL.w, h: HALL.h };

function fitCamera(scene) {
  const cam = scene.cameras.main;
  const area = scene.area || ISLAND;
  const cover = Math.max(scene.scale.width / area.w, scene.scale.height / area.h);
  cam.setZoom(Math.max(3, Math.ceil(cover)));
}

function clampToMap(feet, area = ISLAND) {
  const body = feet.body;
  if (!body) return;
  const x = Phaser.Math.Clamp(feet.x, area.x + body.halfWidth, area.x + area.w - body.halfWidth);
  const y = Phaser.Math.Clamp(feet.y, area.y + body.halfHeight, area.y + area.h - body.halfHeight);
  if (x === feet.x && y === feet.y) return;
  feet.setPosition(x, y);
  body.reset(x, y);
}

function addRect(group, rect) {
  const blocker = group.create(rect.x + rect.w / 2, rect.y + rect.h / 2, 'blank');
  blocker.setDisplaySize(rect.w, rect.h);
  blocker.refreshBody();
  blocker.setVisible(false);
  return blocker;
}

// Shadow ellipses fall down and to the right (moon in the upper left).
const SHADOWS = {
  palace: [180, 14],
  hut: [64, 10],
  ship: [0, 0],
  cave: [0, 0],
  lighthouse: [34, 8],
  olive: [26, 7],
  cypress: [12, 4],
  well: [26, 6],
  boulder: [24, 6],
  amphorae: [20, 5],
  hay: [28, 6],
};

function addProp(scene, prop) {
  const [sw, sh] = SHADOWS[prop.id] || [prop.bodyW * 0.9, 8];
  if (sw > 0) {
    scene.add.ellipse(prop.x + 5, prop.baseY + 1, sw, sh, 0x1a2438, 0.5).setDepth(5200);
  }
  const image = scene.add.image(prop.x, prop.baseY, propTexture(prop.id)).setOrigin(0.5, 1);
  image.setDepth(SORT + prop.baseY);
  image.setTint(prop.id === 'palace' ? 0x9aaacc : MOON_TINT);
  // The ship rides the swell a little.
  if (prop.id === 'ship') {
    scene.tweens.add({
      targets: image,
      y: prop.baseY + 1.5,
      angle: 0.6,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  return image;
}

function addDecor(scene, decor) {
  scene.add.ellipse(decor.x + 2, decor.baseY, decor.id === 'pig' ? 20 : 13, 4, 0x1a2438, 0.45).setDepth(5200);
  const sprite = scene.add.image(decor.x, decor.baseY, propTexture(decor.id)).setOrigin(0.5, 1);
  sprite.setDepth(SORT + decor.baseY);
  sprite.setTint(MOON_TINT);
  // Pigs root about: a small shuffle and a turn now and then.
  const flip = decor.x % 3 === 0;
  sprite.setFlipX(flip);
  scene.tweens.add({
    targets: sprite,
    x: decor.x + (flip ? 6 : -6),
    duration: 2600 + (decor.x % 7) * 300,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    onYoyo: () => sprite.setFlipX(!sprite.flipX),
    onRepeat: () => sprite.setFlipX(!sprite.flipX),
  });
}

function addLamp(scene, group, lamp) {
  const { x, y } = lamp;
  const glow = scene.add.image(x, y - 24, 'lamp-glow');
  glow.setBlendMode(Phaser.BlendModes.ADD);
  glow.setDepth(5400);
  glow.setAlpha(0.6);
  glow.setScale(0.8);
  const sprite = scene.add.sprite(x, y, 'oil-lamp', 0).setOrigin(0.5, 1);
  sprite.setDepth(SORT + y);
  sprite.play({ key: 'lamp-flicker', startFrame: (x + y) % 3 });
  scene.tweens.add({
    targets: glow,
    alpha: 0.4,
    duration: 460 + ((x * 7) % 120),
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  addRect(group, { x: x - 5, y: y - 8, w: 10, h: 8 });
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

function nearestSpot(x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const spot of [...SPOTS, HALL_DOOR_SPOT, ...HALL_SPOTS]) {
    const dist = Math.hypot(spot.x - x, spot.y - y);
    if (dist <= spot.radius && dist < bestDist) {
      best = spot;
      bestDist = dist;
    }
  }
  return best;
}

function createGlints(scene) {
  const glints = [];
  for (let i = 0; i < 14; i += 1) {
    const south = i < 10;
    const glint = scene.add.ellipse(
      south ? Math.random() * MAP_W : 940 + Math.random() * 80,
      south ? 800 + Math.random() * 90 : 300 + Math.random() * 380,
      12 + Math.random() * 18,
      2,
      0xb7dbe8,
      0.3,
    );
    glint.setDepth(2);
    glint.speed = 8 + Math.random() * 14;
    glint.south = south;
    glints.push(glint);
  }
  return glints;
}

function animateGlints(glints, delta) {
  const dt = delta / 1000;
  for (const g of glints) {
    if (g.south) {
      g.x += g.speed * dt;
      if (g.x > MAP_W + 20) g.x = -20;
    } else {
      g.y += g.speed * dt * 0.6;
      if (g.y > 690) g.y = 290;
    }
  }
}

// A few fireflies drift over the olive groves. Cool and quiet, not flames.
function createFireflies(scene) {
  const flies = [];
  const homes = [[300, 560], [700, 560], [760, 640], [360, 640], [150, 260], [900, 230], [240, 480]];
  homes.forEach(([hx, hy], i) => {
    for (let j = 0; j < 2; j += 1) {
      const fly = scene.add.image(hx, hy, 'l2-firefly');
      fly.setBlendMode(Phaser.BlendModes.ADD);
      fly.setDepth(9500);
      fly.home = { x: hx + j * 14, y: hy - 18 - j * 6 };
      fly.phase = i * 1.7 + j * 2.3;
      flies.push(fly);
    }
  });
  return flies;
}

function animateFireflies(flies, time) {
  const t = time / 1000;
  for (const f of flies) {
    f.x = f.home.x + Math.sin(t * 0.7 + f.phase) * 18;
    f.y = f.home.y + Math.cos(t * 0.9 + f.phase * 1.3) * 10;
    f.setAlpha(0.35 + 0.45 * Math.max(0, Math.sin(t * 2.1 + f.phase * 3)));
  }
}

function publishDebug(scene) {
  const { feet } = scene;
  globalThis.__level2 = {
    owner: scene,
    ready: true,
    get x() { return feet.x; },
    get y() { return feet.y; },
    get near() { return scene.nearId; },
    get inputLocked() { return scene.inputLocked; },
    get inHall() { return !!scene.inHall; },
    teleport(x, y) {
      feet.setVelocity(0, 0);
      feet.setPosition(x, y);
      feet.body.reset(x, y);
    },
  };
}
