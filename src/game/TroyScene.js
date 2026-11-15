// Troy at night.
//
// Phaser draws the map. React only hosts the canvas (see TroyWorld.jsx).
// Odysseus is two pieces:
//   feet — a small invisible box that collides with the world
//   hero — the picture, which follows the feet and bobs while he walks
// The picture is taller than the box, so he can stand "behind" columns and roofs.

import Phaser from 'phaser';
import { ANIM_CONFIG, facingFromVector } from './animConfig.js';
import {
  DECOR,
  LAMPS,
  MAP_H,
  MAP_W,
  PROPS,
  SPAWN,
  WALKABLE,
  buildMap,
} from './map.js';
import { Battle } from './battle.js';
import { WARRIOR_CONFIG } from './warriorConfig.js';
import { routeReport } from './routeCheck.js';
import { buildWorldTextures } from './textures.js';

// Pixels per second. Diagonals are scaled so they are not faster.
const SPEED = 80;

export class TroyScene extends Phaser.Scene {
  constructor() {
    super('troy');
    this.facing = 'n';
  }

  preload() {
    this.load.spritesheet(ANIM_CONFIG.textureKey, ANIM_CONFIG.path, {
      frameWidth: ANIM_CONFIG.frameWidth,
      frameHeight: ANIM_CONFIG.frameHeight,
    });

    const walk = ANIM_CONFIG.walk;
    if (walk) {
      this.load.spritesheet('odysseus-walk', walk.path, {
        frameWidth: walk.frameWidth,
        frameHeight: walk.frameHeight,
      });
    }

    // Real PixelLab sheets. See warriorConfig.js. Greek is red, Trojan is teal.
    for (const team of Object.values(WARRIOR_CONFIG.teams)) {
      if (!team.path) continue;
      this.load.spritesheet(team.key, team.path, {
        frameWidth: WARRIOR_CONFIG.frameWidth,
        frameHeight: WARRIOR_CONFIG.frameHeight,
      });
    }

    // Eight facings. The plaza uses frame 0 (south). Native 128px, no rescale.
    this.load.spritesheet('horse', '/assets/sprites/trojan_horse.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  create() {
    const report = routeReport();
    if (!report.ok) {
      console.warn(`Troy layout problem:\n${report.problems.join('\n')}`);
    }

    buildWorldTextures(this);
    if (ANIM_CONFIG.walk) this.createWalkAnims();
    this.anims.create({
      key: 'lamp-flicker',
      frames: this.anims.generateFrameNumbers('oil-lamp', { start: 0, end: 2 }),
      frameRate: 5,
      repeat: -1,
    });
    const horseTex = this.textures.get('horse');
    if (horseTex) horseTex.setFilter(Phaser.Textures.FilterMode.NEAREST);

    const grid = buildMap();
    const map = this.make.tilemap({ data: grid, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage('tiles');
    const ground = map.createLayer(0, tiles, 0, 0);
    ground.setDepth(0);
    // Everything not in WALKABLE is a wall, including the sea and the map edge.
    const solidIndexes = [];
    const maxIndex = Math.max(...grid.flat());
    for (let i = 0; i <= maxIndex; i += 1) {
      if (!WALKABLE.has(i)) solidIndexes.push(i);
    }
    ground.setCollision(solidIndexes);

    this.blockers = this.physics.add.staticGroup();
    for (const prop of PROPS) addSolidProp(this, this.blockers, prop);
    for (const decor of DECOR) {
      this.add.image(decor.x, decor.baseY, decor.id).setOrigin(0.5, 1).setDepth(decor.baseY);
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
    this.feet = this.physics.add.image(SPAWN.x, SPAWN.y, 'feet');
    this.feet.setVisible(false);
    this.feet.setCollideWorldBounds(true);
    this.feet.body.setAllowGravity(false);
    // Warriors bounce off him. He does not get pushed, so a crowd cannot pin him.
    this.feet.body.pushable = false;
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    // A smaller bias so the short feet-box does not get shoved off thin gaps.
    this.physics.world.TILE_BIAS = 4;

    this.heroRim = this.add.sprite(SPAWN.x, SPAWN.y, ANIM_CONFIG.textureKey, ANIM_CONFIG.facingFrames.n);
    this.heroRim.setOrigin(0.5, 1);
    this.heroRim.setTint(0xd0e6ff);
    this.heroRim.setScale(1.07);
    this.hero = this.add.sprite(SPAWN.x, SPAWN.y, ANIM_CONFIG.textureKey, ANIM_CONFIG.facingFrames.n);
    this.hero.setOrigin(0.5, 1);
    this.heroShadow = this.add.ellipse(SPAWN.x, SPAWN.y, 18, 6, 0x0c1424, 0.55);

    this.physics.add.collider(this.feet, ground);
    this.physics.add.collider(this.feet, this.blockers);

    this.battle = new Battle(this, {
      heroBody: this.feet,
      ground,
      blockers: this.blockers,
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
    });
    this.input.keyboard.addCapture([
      'W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT',
    ]);

    publishDebug(this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (globalThis.__troy?.owner === this) delete globalThis.__troy;
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
    const left = this.keys.left.isDown || this.keys.arrowLeft.isDown;
    const right = this.keys.right.isDown || this.keys.arrowRight.isDown;
    const up = this.keys.up.isDown || this.keys.arrowUp.isDown;
    const down = this.keys.down.isDown || this.keys.arrowDown.isDown;

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx === 0 && vy === 0) {
      this.feet.setVelocity(0, 0);
    } else {
      // (1, 1) has length sqrt(2). Divide so a diagonal is not a speed boost.
      const len = Math.hypot(vx, vy);
      this.feet.setVelocity((vx / len) * SPEED, (vy / len) * SPEED);
      this.facing = facingFromVector(vx, vy);
    }

    const moving = this.feet.body.speed > 8;
    const groundY = this.feet.y + this.feet.body.halfHeight;
    const bob = poseHero(this.hero, this.facing, moving, time);
    const hx = Math.round(this.feet.x);
    const hy = Math.round(groundY + bob);
    this.hero.setPosition(hx, hy);
    this.heroRim.setPosition(hx, hy);
    this.heroRim.setFrame(this.hero.frame.name);
    this.heroShadow.setPosition(hx + 4, Math.round(groundY) + 1);
    // Above the moonlight so he stays readable. y still decides who is in front.
    const sort = 7000 + groundY;
    this.heroShadow.setDepth(sort - 2);
    this.heroRim.setDepth(sort - 1);
    this.hero.setDepth(sort);

    const dt = delta / 1000;
    for (const glint of this.glints) {
      glint.x += glint.speed * dt;
      if (glint.x > MAP_W + 20) glint.x = -20;
    }
    this.battle.update(time, delta);
  }
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
    blocked() {
      const b = feet.body.blocked;
      return { up: b.up, down: b.down, left: b.left, right: b.right };
    },
    teleport(x, y) {
      feet.setPosition(x, y);
      feet.body.reset(x, y);
    },
    armies() {
      return scene.battle.summary();
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
      hero.setOrigin(0.5, 1);
    }
    hero.setScale(1, 1);
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

function addSolidProp(scene, group, prop) {
  // Moonlight comes from the upper left, so shadows fall down and to the right.
  const wide = prop.id === 'column' ? 10 : prop.id === 'horse' ? 72 : prop.bodyW * 0.85;
  const tall = prop.id === 'column' ? 4 : prop.id === 'horse' ? 14 : 6;
  const shadow = scene.add.ellipse(prop.x + 5, prop.baseY + 2, wide, tall, 0x1a2438, 0.5);
  // Above the moonlight grade, under the people, so the shadow stays visible.
  shadow.setDepth(5200);
  if (prop.id === 'horse') {
    // Wheels in the south frame end at pixel 122 of 128. Other facings stay loaded.
    const horse = scene.add.sprite(prop.x, prop.baseY, 'horse', 0);
    horse.setOrigin(0.5, 122 / 128);
    horse.setDepth(7000 + prop.baseY);
  } else {
    scene.add.image(prop.x, prop.baseY, prop.id).setOrigin(0.5, 1).setDepth(prop.baseY);
  }
  const bottom = prop.baseY - prop.insetBottom;
  const blocker = group.create(prop.x, bottom - prop.bodyH / 2, 'blank');
  blocker.setDisplaySize(prop.bodyW, prop.bodyH);
  blocker.refreshBody();
  blocker.setVisible(false);
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
      590 + Math.random() * 100,
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
