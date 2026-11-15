// The dark coast of Ithaca. Same feet as Troy: a small box slides on long
// wall rectangles, and the picture follows. Catalog level 6 (the 555
// beacon) opens when he reaches the lighthouse door.

import Phaser from 'phaser';
import { ANIM_CONFIG, facingFromVector } from './animConfig.js';
import { FEET, solidRects } from './map.js';
import { RUN_SPEED, WALK_SPEED } from './patrol.js';
import { buildWorldTextures } from './textures.js';
import {
  LIGHTHOUSE,
  MAP_H,
  MAP_W,
  PENELOPE,
  SPAWN,
  SPOTS,
  buildIthacaMap,
  ithacaLayoutReport,
  lighthouseRect,
  penelopeRect,
} from './ithacaMap.js';

const HERO_SCALE = 4 / 3;

export class IthacaScene extends Phaser.Scene {
  constructor() {
    super('ithaca');
    this.facing = 'n';
    this.nearId = '';
    this.beaconLit = false;
  }

  preload() {
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
    this.load.image('lighthouse-lit', '/assets/props/lighthouse_lit.png');
    this.load.image('lighthouse-unlit', '/assets/props/lighthouse_unlit.png');
    this.load.spritesheet('penelope', '/assets/sprites/npcs/penelope/penelope_sheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    const report = ithacaLayoutReport();
    if (!report.ok) console.warn(`Ithaca layout problem:\n${report.problems.join('\n')}`);

    if (!this.textures.exists('tiles')) buildWorldTextures(this);
    for (const key of ['lighthouse-lit', 'lighthouse-unlit', 'penelope', 'tiles']) {
      const tex = this.textures.get(key);
      if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    if (ANIM_CONFIG.walk && !this.anims.exists('walk-s')) this.createWalkAnims();

    const grid = buildIthacaMap();
    const map = this.make.tilemap({ data: grid, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage('tiles');
    const ground = map.createLayer(0, tiles, 0, 0);
    ground.setDepth(0);

    this.blockers = this.physics.add.staticGroup();
    for (const rect of solidRects(grid)) addRect(this, this.blockers, rect);
    addRect(this, this.blockers, lighthouseRect());
    addRect(this, this.blockers, penelopeRect());

    const towerKey = this.beaconLit ? 'lighthouse-lit' : 'lighthouse-unlit';
    this.lighthouse = this.add.image(LIGHTHOUSE.x, LIGHTHOUSE.baseY, towerKey);
    this.lighthouse.setOrigin(0.5, 1);
    this.lighthouse.setDepth(7000 + LIGHTHOUSE.baseY);

    this.penelopeShadow = this.add.ellipse(PENELOPE.x + 3, PENELOPE.y + 1, 16, 6, 0x0c1424, 0.5);
    this.penelope = this.add.sprite(PENELOPE.x, PENELOPE.y, 'penelope', 0);
    this.penelope.setOrigin(0.5, 1);
    this.penelope.setScale(HERO_SCALE);
    const penelopeSort = 7000 + PENELOPE.y;
    this.penelopeShadow.setDepth(penelopeSort - 2);
    this.penelope.setDepth(penelopeSort);

    this.feet = this.physics.add.image(SPAWN.x, SPAWN.y, 'feet');
    this.feet.setVisible(false);
    this.feet.body.setSize(FEET.w, FEET.h, true);
    this.feet.setCollideWorldBounds(true);
    this.feet.body.setAllowGravity(false);
    this.feet.setBounce(0);
    this.feet.setFriction(0, 0);
    this.feet.setDrag(0, 0);
    this.feet.body.pushable = false;
    this.feet.body.setMaxVelocity(RUN_SPEED, RUN_SPEED);
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    // Same bias as Troy. A 4px bias let the feet sink into a wall and stick.
    this.physics.world.TILE_BIAS = 32;
    this.physics.world.OVERLAP_BIAS = 24;
    this.physics.add.collider(this.feet, this.blockers);

    this.heroRim = this.add.sprite(SPAWN.x, SPAWN.y, ANIM_CONFIG.textureKey, ANIM_CONFIG.facingFrames.n);
    this.heroRim.setOrigin(0.5, 1);
    this.heroRim.setTint(0xd0e6ff);
    this.heroRim.setScale(HERO_SCALE * 1.07);
    this.hero = this.add.sprite(SPAWN.x, SPAWN.y, ANIM_CONFIG.textureKey, ANIM_CONFIG.facingFrames.n);
    this.hero.setOrigin(0.5, 1);
    this.hero.setScale(HERO_SCALE);
    this.heroShadow = this.add.ellipse(SPAWN.x, SPAWN.y, 24, 7, 0x0c1424, 0.55);

    this.prompt = makePrompt(this);
    this.inputLocked = false;

    const cam = this.cameras.main;
    cam.roundPixels = true;
    cam.startFollow(this.feet, true, 0.16, 0.16);
    fitCamera(this);
    cam.fadeIn(500, 6, 10, 18);
    this.scale.on('resize', () => fitCamera(this));

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

    const onLock = () => {
      this.inputLocked = true;
      this.feet.setVelocity(0, 0);
      this.input.keyboard.enabled = false;
    };
    const onUnlock = () => {
      this.inputLocked = false;
      this.input.keyboard.enabled = true;
    };
    const onLit = () => this.lightBeacon();
    this.game.events.on('lockInput', onLock);
    this.game.events.on('unlockInput', onUnlock);
    this.game.events.on('beaconLit', onLit);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('lockInput', onLock);
      this.game.events.off('unlockInput', onUnlock);
      this.game.events.off('beaconLit', onLit);
      if (globalThis.__ithaca?.owner === this) delete globalThis.__ithaca;
    });

    publishDebug(this);
  }

  lightBeacon() {
    if (this.beaconLit) return;
    this.beaconLit = true;
    this.lighthouse.setTexture('lighthouse-lit');
    this.game.events.emit('banner', 'The beacon blinks. Ithaca can see you.');
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

  update(time) {
    clampToMap(this.feet);
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

    if (vx === 0 && vy === 0) {
      this.feet.setVelocity(0, 0);
    } else {
      const len = Math.hypot(vx, vy);
      const speed = !locked && this.keys.shift.isDown ? RUN_SPEED : WALK_SPEED;
      this.feet.setVelocity((vx / len) * speed, (vy / len) * speed);
      this.facing = facingFromVector(vx, vy);
    }

    const moving = this.feet.body.speed > 8;
    const groundY = this.feet.y + this.feet.body.halfHeight;
    const hx = Math.round(this.feet.x);
    const hy = Math.round(groundY);
    poseHero(this.hero, this.facing, moving);
    this.hero.setPosition(hx, hy);
    if (this.heroRim.texture !== this.hero.texture) this.heroRim.setTexture(this.hero.texture.key);
    this.heroRim.setFrame(this.hero.frame.name);
    this.heroRim.setOrigin(0.5, 1);
    this.heroRim.setScale(this.hero.scaleX * 1.07, this.hero.scaleY * 1.07);
    this.heroRim.setPosition(hx, hy);
    this.heroShadow.setPosition(hx + 4, Math.round(groundY) + 1);
    const sort = 7000 + groundY;
    this.heroShadow.setDepth(sort - 2);
    this.heroRim.setDepth(sort - 1);
    this.hero.setDepth(sort);

    this.nearest = locked ? null : nearestSpot(this.feet.x, this.feet.y);
    if (this.nearest) {
      this.prompt.setText(this.nearest.prompt);
      this.prompt.setVisible(true);
      this.prompt.setPosition(hx, Math.round(groundY) - 58);
      this.prompt.setDepth(sort + 4);
    } else {
      this.prompt.setVisible(false);
    }

    const nearId = this.nearest ? this.nearest.id : '';
    if (nearId !== this.nearId) {
      this.nearId = nearId;
      this.game.events.emit('near', this.nearest);
    }

    if (!locked && this.input.keyboard.enabled && Phaser.Input.Keyboard.JustDown(this.keys.keyE) && this.nearest) {
      this.interact(this.nearest);
    }
  }

  interact(spot) {
    if (!spot || this.inputLocked) return;
    this.inputLocked = true;
    this.feet.setVelocity(0, 0);
    if (spot.id === 'beacon') {
      this.input.keyboard.enabled = false;
      this.game.events.emit('openBeacon');
      return;
    }
    this.input.keyboard.enabled = false;
    this.game.events.emit('talk', {
      id: 'penelope',
      who: 'Penelope',
      line: 'The beacon has been dark since you sailed. Light it, and Ithaca will know you are home.',
    });
  }
}

function poseHero(hero, facing, moving) {
  const idle = ANIM_CONFIG.facingFrames[facing];
  if (ANIM_CONFIG.walk && moving) {
    hero.anims.play(`walk-${facing}`, true);
  } else {
    hero.anims.stop();
    hero.setTexture(ANIM_CONFIG.textureKey, idle);
  }
  hero.setOrigin(0.5, 1);
  hero.setScale(HERO_SCALE, HERO_SCALE);
}

// Zoom stays on whole pixels. On a wide screen, 3× would show the dark
// page past the map, so the camera tightens until the coast fills the view.
function fitCamera(scene) {
  const cam = scene.cameras.main;
  const cover = Math.max(scene.scale.width / MAP_W, scene.scale.height / MAP_H);
  cam.setBounds(0, 0, MAP_W, MAP_H);
  cam.setZoom(Math.max(3, Math.ceil(cover)));
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

function addRect(scene, group, rect) {
  const blocker = group.create(rect.x + rect.w / 2, rect.y + rect.h / 2, 'blank');
  blocker.setDisplaySize(rect.w, rect.h);
  blocker.refreshBody();
  blocker.setVisible(false);
  return blocker;
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
  for (const spot of SPOTS) {
    const dist = Math.hypot(spot.x - x, spot.y - y);
    if (dist <= spot.radius && dist < bestDist) {
      best = spot;
      bestDist = dist;
    }
  }
  return best;
}

function publishDebug(scene) {
  const { feet } = scene;
  globalThis.__ithaca = {
    owner: scene,
    ready: true,
    get x() { return feet.x; },
    get y() { return feet.y; },
    get facing() { return scene.facing; },
    get near() { return scene.nearest ? scene.nearest.id : ''; },
    get lit() { return scene.beaconLit; },
    get inputLocked() { return scene.inputLocked; },
    blocked() {
      const b = feet.body.blocked;
      return { up: b.up, down: b.down, left: b.left, right: b.right };
    },
    teleport(x, y) {
      feet.setVelocity(0, 0);
      feet.setPosition(x, y);
      feet.body.reset(x, y);
    },
  };
}
