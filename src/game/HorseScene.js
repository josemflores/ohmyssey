// Inside the Trojan horse.
//
// A small wooden belly, the same brown planks as the horse outside.
// Most of the screen stays black. One lamp lights the boards around him,
// so the room feels tight.
//
// The trap door shows "Press E" when he stands on it.
// A correct answer unlocks it. Then that press climbs back out.

import Phaser from 'phaser';
import { ANIM_CONFIG, facingFromVector } from './animConfig.js';
import { firstHatchQuestion } from './hatchQuestions.js';
import { buildWorldTextures } from './textures.js';
import { WARRIOR_CONFIG } from './warriorConfig.js';

// Same wood colors as public/assets/sprites/trojan_horse.png.
const WOOD = {
  lit: '#c48962',
  plank: '#b16a4a',
  mid: '#944f3d',
  seam: '#58252d',
  shadow: '#7c3b34',
  dark: '#4a1d2a',
};

const ROOM_W = 192;
const ROOM_H = 144;
const WALL = 18;
const SPEED = 70;
const HERO_SCALE = 4 / 3;

// He wakes up in the middle of the belly.
const SPAWN = { x: 96, y: 64 };

// The hatch in the floor. Stand on this to see "Press E".
const TRAP = {
  id: 'trap_door',
  x: 96,
  y: 108,
  radius: 22,
  prompt: 'Press E',
  type: 'hatch',
};

// Two posts so the walkway stays narrow.
const POSTS = [
  { x: 52, y: 86, w: 12, h: 12 },
  { x: 140, y: 86, w: 12, h: 12 },
];

// His men, already waiting in the belly. No collision: the room is tight enough.
const SQUAD = [
  { x: 70, y: 50, facing: 'se' },
  { x: 124, y: 52, facing: 'sw' },
  { x: 58, y: 92, facing: 'e' },
];

// Where he stands once the hatch lets him out.
const OUTSIDE = { x: 480, y: 260 };

// ============================================================
// Trap door button.
//
// Locked: E asks the placeholder question (React shows it).
// Unlocked: E climbs out beside the horse.
// A correct answer emits 'unlockHatch' on game.events.
// ============================================================
export function onTrapDoor(scene) {
  if (scene.inputLocked) return;
  if (scene.hatchUnlocked) {
    scene.scene.start('troy', OUTSIDE);
    return;
  }
  scene.game.events.emit('hatchQuestion', firstHatchQuestion());
}

export class HorseScene extends Phaser.Scene {
  constructor() {
    super('horse');
    this.facing = 's';
  }

  preload() {
    // Skip a sheet that is already loaded so a later visit does not wipe it.
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
    const greek = WARRIOR_CONFIG.teams.greek;
    if (greek.path && !this.textures.exists(greek.key)) {
      this.load.spritesheet(greek.key, greek.path, {
        frameWidth: WARRIOR_CONFIG.frameWidth,
        frameHeight: WARRIOR_CONFIG.frameHeight,
      });
    }
  }

  create() {
    if (!this.textures.exists('feet')) buildWorldTextures(this);
    if (!this.textures.exists('belly-floor')) {
      const floor = this.textures.addCanvas('belly-floor', paintBelly());
      floor.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    if (!this.textures.exists('belly-dark')) {
      this.textures.addCanvas('belly-dark', paintDark());
    }
    if (ANIM_CONFIG.walk && !this.anims.exists('walk-s')) this.createWalkAnims();
    if (!this.anims.exists('lamp-flicker')) {
      this.anims.create({
        key: 'lamp-flicker',
        frames: this.anims.generateFrameNumbers('oil-lamp', { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1,
      });
    }

    this.cameras.main.setBackgroundColor('#070504');
    this.add.image(ROOM_W / 2, ROOM_H / 2, 'belly-floor').setDepth(0);

    this.posts = this.physics.add.staticGroup();
    for (const post of POSTS) {
      const block = this.posts.create(post.x, post.y, 'blank');
      block.setDisplaySize(post.w, post.h);
      block.refreshBody();
      block.setVisible(false);
      this.add.rectangle(post.x, post.y, post.w, post.h, 0x4a1d2a).setDepth(post.y);
    }

    // One lamp, like a man left it burning. The pool of light is small.
    const lampX = 156;
    const lampY = 46;
    const glow = this.add.image(lampX, lampY - 22, 'lamp-glow');
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(4);
    glow.setAlpha(0.7);
    glow.setScale(0.55);
    const lamp = this.add.sprite(lampX, lampY, 'oil-lamp', 0).setOrigin(0.5, 1);
    lamp.setDepth(7000 + lampY);
    lamp.play('lamp-flicker');

    const greek = WARRIOR_CONFIG.teams.greek;
    const greekTex = this.textures.get(greek.key);
    if (greekTex) greekTex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.squad = SQUAD.map((man) => {
      const frame = WARRIOR_CONFIG.facingFrames[man.facing] ?? 0;
      const sprite = this.add.sprite(man.x, man.y, greek.key, frame);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(7000 + man.y);
      const shadow = this.add.ellipse(man.x + 3, man.y + 1, 16, 5, 0x1a0c08, 0.45);
      shadow.setDepth(7000 + man.y - 2);
      return sprite;
    });

    this.feet = this.physics.add.image(SPAWN.x, SPAWN.y, 'feet');
    this.feet.setVisible(false);
    this.feet.body.setAllowGravity(false);
    this.feet.setCollideWorldBounds(true);
    this.physics.world.setBounds(WALL, WALL, ROOM_W - WALL * 2, ROOM_H - WALL * 2);
    this.physics.add.collider(this.feet, this.posts);

    this.heroRim = this.add.sprite(SPAWN.x, SPAWN.y, ANIM_CONFIG.textureKey, ANIM_CONFIG.facingFrames.s);
    this.heroRim.setOrigin(0.5, 1).setTint(0xd0e6ff).setScale(HERO_SCALE * 1.07);
    this.hero = this.add.sprite(SPAWN.x, SPAWN.y, ANIM_CONFIG.textureKey, ANIM_CONFIG.facingFrames.s);
    this.hero.setOrigin(0.5, 1).setScale(HERO_SCALE);
    this.heroShadow = this.add.ellipse(SPAWN.x, SPAWN.y, 18, 6, 0x1a0c08, 0.55);

    this.prompt = makePrompt(this);
    this.nearest = null;

    // Black around the lamp light. It follows the screen, and the camera
    // follows him, so the bright spot stays on his body.
    this.dark = this.add.image(0, 0, 'belly-dark')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(14000);
    const fitDark = () => {
      this.dark.setDisplaySize(this.scale.width, this.scale.height);
    };
    fitDark();
    this.scale.on('resize', fitDark);

    const cam = this.cameras.main;
    // Extra black around the planks so the camera can sit on him
    // instead of pinning the room to the corner of the screen.
    const pad = 240;
    cam.setBounds(-pad, -pad, ROOM_W + pad * 2, ROOM_H + pad * 2);
    cam.setZoom(5);
    cam.roundPixels = true;
    cam.startFollow(this.feet, true, 0.2, 0.2);
    cam.fadeIn(350, 7, 5, 4);

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
    });
    this.input.keyboard.addCapture([
      'W', 'A', 'S', 'D', 'E', 'UP', 'DOWN', 'LEFT', 'RIGHT',
    ]);
    // The question box locks his feet. A right answer opens the hatch.
    this.inputLocked = false;
    this.hatchUnlocked = false;
    const lockInput = () => {
      this.inputLocked = true;
      this.feet.setVelocity(0, 0);
    };
    const unlockInput = () => { this.inputLocked = false; };
    const unlockHatch = () => { this.hatchUnlocked = true; };
    this.game.events.on('lockInput', lockInput);
    this.game.events.on('unlockInput', unlockInput);
    this.game.events.on('unlockHatch', unlockHatch);

    this.game.events.emit('place', 'horse');
    publishDebug(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('lockInput', lockInput);
      this.game.events.off('unlockInput', unlockInput);
      this.game.events.off('unlockHatch', unlockHatch);
      this.game.events.emit('place', 'troy');
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

  update(time) {
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
      this.feet.setVelocity((vx / len) * SPEED, (vy / len) * SPEED);
      this.facing = facingFromVector(vx, vy);
    }

    const moving = this.feet.body.speed > 8;
    const groundY = this.feet.y + this.feet.body.halfHeight;
    poseHero(this.hero, this.facing, moving);
    const hx = Math.round(this.feet.x);
    const hy = Math.round(groundY);
    this.hero.setPosition(hx, hy);
    if (this.heroRim.texture !== this.hero.texture) {
      this.heroRim.setTexture(this.hero.texture.key);
    }
    this.heroRim.setFrame(this.hero.frame.name);
    this.heroRim.setOrigin(0.5, 1);
    this.heroRim.setPosition(hx, hy);
    this.heroShadow.setPosition(hx + 3, Math.round(groundY) + 1);
    const sort = 7000 + groundY;
    this.heroShadow.setDepth(sort - 2);
    this.heroRim.setDepth(sort - 1);
    this.hero.setDepth(sort);

    const dist = Math.hypot(TRAP.x - this.feet.x, TRAP.y - this.feet.y);
    this.nearest = !locked && dist <= TRAP.radius ? TRAP : null;
    if (this.nearest) {
      this.prompt.setText(this.hatchUnlocked ? 'Climb out' : 'Press E');
      this.prompt.setVisible(true);
      this.prompt.setPosition(hx, hy - 36);
      // Above the black vignette, or the label sits in the dark and disappears.
      this.prompt.setDepth(15000);
    } else {
      this.prompt.setVisible(false);
    }

    if (this.nearest && Phaser.Input.Keyboard.JustDown(this.keys.keyE)) {
      onTrapDoor(this);
    }
  }
}

function publishDebug(scene) {
  const { feet } = scene;
  globalThis.__troy = {
    owner: scene,
    ready: true,
    place: 'horse',
    get x() { return feet.x; },
    get y() { return feet.y; },
    get interactable() { return scene.nearest; },
    get hatchUnlocked() { return scene.hatchUnlocked; },
    get soldiers() { return scene.squad.length; },
    teleport(x, y) {
      feet.setPosition(x, y);
      feet.body.reset(x, y);
    },
  };
}

function poseHero(hero, facing, moving) {
  const idle = ANIM_CONFIG.facingFrames[facing];
  if (ANIM_CONFIG.walk) {
    if (moving) hero.anims.play(`walk-${facing}`, true);
    else {
      hero.anims.stop();
      hero.setTexture(ANIM_CONFIG.textureKey, idle);
    }
    hero.setOrigin(0.5, 1);
    hero.setScale(HERO_SCALE, HERO_SCALE);
    return;
  }
  hero.setFrame(idle);
  hero.setScale(1, 1);
}

function makePrompt(scene) {
  // 15px letters shrunk to 1/3. The camera zoom is 5, so they stay sharp.
  const label = scene.add.text(0, 0, 'Press E', {
    fontFamily: 'monospace',
    fontSize: '15px',
    color: '#f6ead2',
    backgroundColor: '#1a0e0c',
    padding: { left: 6, right: 6, top: 3, bottom: 3 },
  });
  label.setScale(1 / 3);
  label.setOrigin(0.5, 1);
  label.setVisible(false);
  return label;
}

function paintBelly() {
  const canvas = document.createElement('canvas');
  canvas.width = ROOM_W;
  canvas.height = ROOM_H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = WOOD.mid;
  ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  for (let y = 0; y < ROOM_H; y += 8) {
    ctx.fillStyle = (y / 8) % 2 === 0 ? WOOD.plank : WOOD.mid;
    ctx.fillRect(0, y, ROOM_W, 7);
    ctx.fillStyle = WOOD.lit;
    ctx.fillRect(0, y, ROOM_W, 1);
    ctx.fillStyle = WOOD.seam;
    ctx.fillRect(0, y + 7, ROOM_W, 1);
    const split = (y / 8) % 2 === 0 ? 36 : 18;
    for (let x = split; x < ROOM_W; x += 46) ctx.fillRect(x, y, 1, 8);
  }

  paintBoards(ctx, 0, 0, ROOM_W, WALL, false);
  paintBoards(ctx, 0, ROOM_H - WALL, ROOM_W, WALL, false);
  paintBoards(ctx, 0, 0, WALL, ROOM_H, true);
  paintBoards(ctx, ROOM_W - WALL, 0, WALL, ROOM_H, true);

  const scraps = [
    [36, 32, 11, 7], [70, 44, 8, 6], [118, 36, 12, 7],
    [132, 78, 9, 6], [48, 90, 10, 7], [108, 86, 8, 5],
    [80, 58, 7, 8], [60, 70, 9, 5],
  ];
  for (const [x, y, w, h] of scraps) {
    ctx.fillStyle = '#e7d3b0';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#c4b59f';
    ctx.fillRect(x + 1, y + 2, w - 2, 1);
    ctx.fillRect(x + 1, y + 4, w - 3, 1);
  }

  const dx = TRAP.x - 16;
  const dy = TRAP.y - 10;
  ctx.fillStyle = WOOD.dark;
  ctx.fillRect(dx - 1, dy - 1, 34, 22);
  ctx.fillStyle = WOOD.shadow;
  ctx.fillRect(dx, dy, 32, 20);
  ctx.fillStyle = WOOD.seam;
  for (let i = 0; i < 32; i += 8) ctx.fillRect(dx + i, dy, 1, 20);
  ctx.fillStyle = '#e7d3b0';
  ctx.fillRect(dx + 14, dy + 7, 4, 5);
  ctx.fillStyle = WOOD.dark;
  ctx.fillRect(dx + 15, dy + 8, 2, 3);

  return canvas;
}

function paintBoards(ctx, x, y, w, h, vertical) {
  ctx.fillStyle = WOOD.shadow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = WOOD.dark;
  if (vertical) {
    for (let px = x; px < x + w; px += 6) ctx.fillRect(px, y, 1, h);
  } else {
    for (let py = y; py < y + h; py += 6) ctx.fillRect(x, py, w, 1);
  }
}

function paintDark() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  // The picture is stretched over the whole screen, so the bright hole
  // has to be a small part of this canvas or the room will not feel tight.
  // Wide enough that Odysseus, the three Greeks, and the hatch stay in the light.
  const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 96);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.62, 'rgba(0,0,0,0.28)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return canvas;
}
