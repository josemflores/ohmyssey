// Troy at night.
//
// Phaser draws the map. React only hosts the canvas (see TroyWorld.jsx).
// Odysseus is two pieces:
//   feet — a small invisible box that collides with the world
//   hero — the picture, which follows the feet. A walk sheet plays while he
//   moves; without one, the idle frame bobs instead.
// The picture is taller than the box, so he can stand "behind" columns and roofs.

import Phaser from 'phaser';
import { loadHeroActions, createHeroActions } from './heroAnimations.js';
import { loadSoldierActions, createSoldierActions, createSoldierWalks, playSoldierIdle } from './soldierAnimations.js';
import { GATE_VIEW_Y, startGateBattle } from './gateBattle.js';
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
import { attackById, createBattleQuestions, nextGateQuestion } from './battleQuestions.js';
import { WARRIOR_CONFIG } from './warriorConfig.js';
import { routeReport } from './routeCheck.js';
import { buildWorldTextures } from './textures.js';

// Walk speed lives in patrol.js so the sentries match him. Shift runs.
// The LPC figure fills about 25 of the 32px cell. 4/3 brings him in line
// with the army sprites (about 30px tall) and stays on whole screen pixels
// at the camera's 3× zoom.
// Odysseus is drawn at the same 1x as the Greek and Trojan soldiers. They
// all share the same 32x32 LPC body, so 4/3 made him a head taller than
// everyone else in the horse and in Troy.
// Night in Troy. The ground is darkened by a blue multiply over the whole
// map (MOON). Buildings, trees and props draw above that grade, so they get
// their own blue tint (NIGHT_TINT), a little lighter than the ground so they
// still stand out. People are not tinted, so they stay easy to read.
const MOON = 0x55648a;
const NIGHT_TINT = 0x7482a8;

const HERO_SCALE = 1;

// How long each battle picture plays before the turn strip moves on.
const TROJAN_HP = 8;
const ENEMY_SWING = 2;

// The three Trojan groups to beat stand in front of (south of) the wooden
// horse, guarding it, on open paving clear of houses and trees.
const CITY_GROUPS = [
  { id: 'west', x: 360, y: 312, count: 4 },
  { id: 'center', x: 480, y: 340, count: 3 },
  { id: 'east', x: 600, y: 312, count: 2 },
];
// How the men of a group stand around their group's center, by group size.
// Loose clusters, not a line: some forward, some back, turned slightly
// toward each other or out at the street. dx/dy are pixels; face is the
// way he looks (the idle animation has all eight facings).
const GROUP_FORMATIONS = {
  2: [
    { dx: -13, dy: -5, face: 'se' },
    { dx: 11, dy: 7, face: 's' },
  ],
  3: [
    { dx: -22, dy: 4, face: 'se' },
    { dx: 2, dy: -10, face: 's' },
    { dx: 21, dy: 8, face: 'sw' },
  ],
  4: [
    { dx: -28, dy: -2, face: 'se' },
    { dx: -6, dy: 10, face: 's' },
    { dx: 12, dy: -11, face: 'sw' },
    { dx: 31, dy: 5, face: 'w' },
  ],
};

// Wet sand at the end of the beach road, hull overlapping the sea.
const SHIP = { x: 480, y: 786 };

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
    loadHeroActions(this);
    // Idle, attack, and hit sheets for the LPC Greeks and Trojans.
    loadSoldierActions(this);
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

    // LPC walk sheets (art/scripts/build_soldiers_lpc.py). Four frames
    // across, eight facing rows, same layout as the older hoplite sheets.
    if (!this.textures.exists('trojan-soldier')) {
      this.load.spritesheet('trojan-soldier', '/assets/sprites/npcs/trojan_lpc/trojan_walk_32.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
    }
    if (!this.textures.exists('greek-hoplite')) {
      this.load.spritesheet('greek-hoplite', '/assets/sprites/npcs/greek_lpc/greek_walk_32.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
    }
  }

  create() {
    createHeroActions(this);
    createSoldierActions(this);
    createSoldierWalks(this);
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
      this.add.image(decor.x, decor.baseY, decor.id).setOrigin(0.5, 1).setDepth(7000 + decor.baseY)
        .setTint(NIGHT_TINT);
    }

    this.glints = createGlints(this);
    // Deep blue moonlight over the ground (see MOON at the top of the file).
    // Lamps and people are drawn later, above this grade.
    const moon = this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, MOON, 1);
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
    // Soldiers are solid: the city groups and the duelists inside the gate
    // each get a footprint (see spawnCityGroups and gateBattle.js).
    this.soldierBlockers = this.physics.add.staticGroup();
    this.physics.add.collider(this.feet, this.soldierBlockers);

    // The road and the gate stay empty. Kevin removed the four Trojan
    // sentries that used to stand in front of the shut doors, so nobody
    // guards the gate. Street foes still come from relief, if it starts.
    this.questions = createBattleQuestions();
    this.relief = createRelief(this);
    this.cityGroups = [];
    this.groupsSpawned = false;
    this.gateQuestion = null;
    this.sailing = false;
    this.boatWarned = false;
    addShip(this);
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
    const fitCamera = () => fitTroyCamera(this);
    fitCamera();
    this.scale.on('resize', fitCamera);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', fitCamera);
    });

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
      this.endFight(false, 'You slip back. That group still holds.');
    };
    const onGatePick = (payload) => this.answerGate(payload);
    const onGateDismiss = () => this.dismissGate();
    this.game.events.on('lockInput', lockInput);
    this.game.events.on('unlockInput', unlockInput);
    this.game.events.on('fightStrike', onStrike);
    this.game.events.on('fightAttack', onAttack);
    this.game.events.on('fightEnemyAct', onEnemyAct);
    this.game.events.on('fightFlee', onFlee);
    this.game.events.on('gatePick', onGatePick);
    this.game.events.on('gateDismiss', onGateDismiss);

    publishDebug(this);
    this.publishObjective();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('lockInput', lockInput);
      this.game.events.off('unlockInput', unlockInput);
      this.game.events.off('fightStrike', onStrike);
      this.game.events.off('fightAttack', onAttack);
      this.game.events.off('fightEnemyAct', onEnemyAct);
      this.game.events.off('fightFlee', onFlee);
      this.game.events.off('gatePick', onGatePick);
      this.game.events.off('gateDismiss', onGateDismiss);
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
      this.askGate();
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

    // During the gate cinematic he walks a short scripted step back.
    if (this.scriptedMove) {
      const goal = this.scriptedMove;
      const dx = goal.x - this.feet.x;
      const dy = goal.y - this.feet.y;
      const dist = Math.hypot(dx, dy);
      // Give up only if something truly blocks him for a few frames.
      const b = this.feet.body.blocked;
      goal.stuck = (b.up || b.down || b.left || b.right) ? (goal.stuck || 0) + 1 : 0;
      if (dist < 2 || goal.stuck > 12) {
        this.scriptedMove = null;
        this.facing = goal.face || this.facing;
      } else {
        vx = dx / dist;
        vy = dy / dist;
      }
    }

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
    if (!this.fighting && !this.gateQuestion && Phaser.Input.Keyboard.JustDown(this.keys.keyE)) {
      if (locked) {
        if (!this.gateFalling) this.game.events.emit('closeInteract');
      } else if (this.nearBoat(70)) {
        this.touchBoat();
      } else {
        const group = this.nearestGroup(44);
        if (group) this.beginGroupFight(group);
        else if (this.nearest) this.interact(this.nearest);
      }
    }

    const dt = delta / 1000;
    for (const glint of this.glints) {
      glint.x += glint.speed * dt;
      if (glint.x > MAP_W + 20) glint.x = -20;
    }

    this.relief.update(dt);
    this.watchBoat();
    if (this.fightCooldown > 0) this.fightCooldown -= dt;
    this.maybeHintRun(moving);
    if (!this.fighting && !locked && this.questDone) this.maybeMeetGroup(moving);
    if (!this.fighting && !locked) this.maybeMeetFoe();
    aimArrow(this);
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

  askGate() {
    this.inputLocked = true;
    this.feet.setVelocity(0, 0);
    this.gateQuestion = nextGateQuestion();
    this.game.events.emit('gateQuestion', {
      id: this.gateQuestion.id,
      prompt: this.gateQuestion.prompt,
      choices: this.gateQuestion.choices,
    });
  }

  answerGate(payload) {
    const question = this.gateQuestion;
    if (!question) return;
    if (payload.index !== question.answer) {
      this.game.events.emit('gateWrong', {
        hint: question.hint || 'Not that one. The gate stays shut.',
      });
      return;
    }
    this.gateQuestion = null;
    this.game.events.emit('gateClosed');
    this.playGateVictory();
  }

  dismissGate() {
    this.gateQuestion = null;
    if (!this.gateFalling) this.inputLocked = false;
  }

  beginFight() {
    this.fighting = true;
    this.inputLocked = true;
    this.feet.setVelocity(0, 0);
    this.fight = {
      group: null,
      foes: [{ id: 'solo', name: 'Trojan sentry', hp: FOE_MAX, max: FOE_MAX }],
    };
    this.emitFightStart('Trojan sentry');
  }

  beginGroupFight(group) {
    if (!group || group.gone || this.fighting) return;
    this.fighting = true;
    this.inputLocked = true;
    this.feet.setVelocity(0, 0);
    this.fight = {
      group,
      foes: group.members.map((member, index) => ({
        id: `${group.id}-${index}`,
        name: 'Trojan',
        hp: TROJAN_HP,
        max: TROJAN_HP,
      })),
    };
    this.emitFightStart('Trojans');
  }

  // Octopath-style lead-in: a white flash, the camera lunges in on Odysseus
  // with a slight twist and a jolt, then the battle screen opens (its own
  // shard wipe is in soldierBattle.css). The camera eases back in endFight.
  emitFightStart(name) {
    const cam = this.cameras.main;
    if (this.preFightZoom == null) this.preFightZoom = cam.zoom;
    cam.flash(140, 255, 244, 224);
    cam.shake(220, 0.004);
    cam.zoomTo(this.preFightZoom * 1.6, 520, 'Sine.easeIn');
    if (cam.rotateTo) cam.rotateTo(0.08, false, 520, 'Sine.easeIn');
    this.time.delayedCall(540, () => {
      if (!this.fighting || !this.fight) return;
      this.openFightScreen(name);
    });
  }

  // Undo the lead-in zoom and twist once the fight is over.
  settleCamera() {
    const cam = this.cameras.main;
    if (this.preFightZoom == null) return;
    cam.zoomTo(this.preFightZoom, 380, 'Sine.easeOut');
    if (cam.rotateTo) cam.rotateTo(0, false, 380, 'Sine.easeOut');
    this.preFightZoom = null;
  }

  openFightScreen(name) {
    this.game.events.emit('fightStart', {
      id: this.fight.group ? this.fight.group.id : 'trojan',
      name,
      side: 'hero',
      heroHp: this.heroHp,
      heroMax: HERO_MAX,
      foes: this.foeView(),
    });
  }

  foeView() {
    return this.fight.foes.map((foe) => ({
      id: foe.id,
      name: foe.name,
      hp: foe.hp,
      max: foe.max,
    }));
  }

  frontIndex() {
    return this.fight.foes.findIndex((foe) => foe.hp > 0);
  }

  allDown() {
    return this.fight.foes.every((foe) => foe.hp <= 0);
  }

  // A right answer hits the front living Trojan. Heavy (allEnemies) hits
  // every living Trojan instead. A wrong answer misses, then each living
  // Trojan strikes.
  resolveStrike(payload) {
    const fight = this.fight;
    if (!fight || !this.fighting || !fight.question) return;
    const attack = fight.attack || attackById('light');
    const correct = payload.index === fight.question.answer;
    fight.question = null;
    const index = this.frontIndex();
    const fallen = [];
    let damage = 0;
    if (correct && index >= 0) {
      damage = attack.damage;
      if (attack.allEnemies) {
        // Every Trojan still standing takes the same hit.
        fight.foes.forEach((foe, i) => this.hurtFoe(i, damage, fallen));
      } else {
        this.hurtFoe(index, damage, fallen);
      }
    }
    const note = correct
      ? (attack.allEnemies
        ? `${attack.label} sweeps every Trojan for ${damage}.`
        : `${attack.label} lands for ${damage}.`)
      : 'The blow misses.';
    this.game.events.emit('fightBlow', {
      anim: correct ? attack.anim : 'whiff',
      foeIndex: index,
      fallen,
      splash: attack.id === 'heavy',
      damage,
      heroHp: this.heroHp,
      foes: this.foeView(),
      note,
      // Structured copy of the note, for the battle log plaque.
      log: correct
        ? { who: 'greek', name: 'Odysseus', action: attack.allEnemies ? `${attack.label} · all` : attack.label, damage, splash: 0 }
        : { who: 'greek', name: 'Odysseus', action: 'misses', damage: 0 },
      side: 'hero',
    });
    const wait = Math.max(BLOW_MS[correct ? attack.anim : 'whiff'] || 700, fallen.length ? 880 : 0);
    this.time.delayedCall(wait, () => {
      if (!this.fighting) return;
      if (this.allDown()) {
        this.endFight(true, 'The group falls.');
        return;
      }
      this.counterAt(0);
    });
  }

  hurtFoe(index, amount, fallen) {
    const foe = this.fight.foes[index];
    if (!foe || foe.hp <= 0) return;
    foe.hp = Math.max(0, foe.hp - amount);
    if (foe.hp <= 0) fallen.push(index);
  }

  counterAt(step) {
    const fight = this.fight;
    if (!fight || !this.fighting) return;
    const living = fight.foes.map((foe, index) => index).filter((index) => fight.foes[index].hp > 0);
    if (step >= living.length) {
      this.game.events.emit('fightTurn', {
        side: 'hero',
        heroHp: this.heroHp,
        foes: this.foeView(),
        note: fight.note || '',
      });
      return;
    }
    const index = living[step];
    this.heroHp = Math.max(0, this.heroHp - ENEMY_SWING);
    const down = this.heroHp <= 0;
    const shown = this.heroHp;
    const note = `A Trojan strikes for ${ENEMY_SWING}.`;
    fight.note = note;
    this.game.events.emit('fightBlow', {
      anim: 'counter',
      foeIndex: index,
      fallen: [],
      damage: ENEMY_SWING,
      heroHp: shown,
      foes: this.foeView(),
      note,
      log: { who: 'trojan', name: fight.foes[index]?.name || 'Trojan', action: 'strikes', damage: ENEMY_SWING },
      side: 'enemy',
    });
    this.time.delayedCall(BLOW_MS.counter, () => {
      if (!this.fighting) return;
      if (down) {
        // Game over. Odysseus stops where he is; React shows the
        // "Odysseus has Fallen" screen with Return to Menu and Restart.
        this.inputLocked = true;
        this.game.events.emit('gameOver');
        return;
      }
      this.counterAt(step + 1);
    });
  }

  heroHpStay() {
    this.game.registry.set('heroHp', this.heroHp);
  }

  enemyAct() {
    // Counters play on their own after the player's blow.
  }

  endFight(won, note) {
    this.settleCamera();
    const group = this.fight && this.fight.group;
    const foe = this.engagedFoe;
    this.engagedFoe = null;
    this.fighting = false;
    this.fight = null;
    this.fightCooldown = 1.4;
    this.inputLocked = false;
    this.game.events.emit('fightEnd', { won, note });
    if (group) {
      if (won) this.removeGroup(group);
      this.publishObjective();
      if (won && this.shoreReady()) {
        this.game.events.emit('notice', 'The shore is open. The ship is waiting.');
        if (this.shipMark) this.shipMark.setVisible(true);
      }
      return;
    }
    if (won) this.relief.retire(foe);
    else this.relief.separate(foe, this.feet);
    if (won && this.relief.phase() === 'foes' && this.relief.foeCount() === 0) {
      this.game.events.emit('levelComplete');
    }
  }

  // A right answer at the doors. The army comes through, and the city stays open.
  playGateVictory() {
    if (this.questDone) return;
    this.questDone = true;
    this.gateFalling = true;
    this.inputLocked = true;
    this.feet.setVelocity(0, 0);
    this.game.registry.set('gateOpen', true);
    this.game.events.emit('questDone');
    // The gate is open: the tracker crosses out "Reach the gate" now, while
    // the doors open, and shows the next objective (TroyWorld.jsx).
    this.publishObjective();
    if (this.prompt) this.prompt.setVisible(false);
    playGateFall(this, () => {
      this.gateFalling = false;
      this.inputLocked = false;
      this.spawnCityGroups();
      this.publishObjective();
      this.game.events.emit('notice', 'The army is through. Clear the Trojan groups.');
    });
  }

  // Distance to a group is to its nearest soldier. The soldiers are solid,
  // so he touches the edge of a wide group long before its middle.
  groupDistance(group) {
    let best = Infinity;
    for (const member of group.members) {
      best = Math.min(best, Math.hypot(member.x - this.feet.x, member.y - this.feet.y));
    }
    return best;
  }

  nearestGroup(radius) {
    if (!this.questDone || !this.cityGroups) return null;
    let best = null;
    let bestDist = radius;
    for (const group of this.cityGroups) {
      if (group.gone) continue;
      const dist = this.groupDistance(group);
      if (dist <= bestDist) {
        best = group;
        bestDist = dist;
      }
    }
    return best;
  }

  maybeMeetGroup(moving) {
    if (!moving || this.fightCooldown > 0 || this.gateFalling) return;
    // Bumping into any soldier of the group starts the fight.
    const group = this.nearestGroup(32);
    if (group) this.beginGroupFight(group);
  }

  groupsLeft() {
    return this.cityGroups.filter((group) => !group.gone).length;
  }

  shoreReady() {
    return this.groupsSpawned && this.groupsLeft() === 0;
  }

  publishObjective() {
    const total = CITY_GROUPS.length;
    const left = this.groupsSpawned ? this.groupsLeft() : total;
    const cleared = total - left;
    let title;
    let note;
    if (!this.questDone) {
      title = 'Reach the gate';
      note = 'Open the gate (E)';
    } else if (!this.shoreReady()) {
      title = `Defeat the Trojan warriors! (${cleared}/${total})`;
      note = 'Walk into a group, or press E';
    } else {
      title = 'Leave through the gate';
      note = 'Reach the ship at the shore';
    }
    this.game.events.emit('objective', { title, note, cleared, total });
    if (this.shipMark) this.shipMark.setVisible(this.shoreReady() && !this.sailing);
  }

  nearBoat(radius) {
    if (!this.ship) return false;
    return Math.hypot(this.ship.x - this.feet.x, this.ship.y - this.feet.y) <= radius;
  }

  watchBoat() {
    if (this.sailing || this.fighting || this.gateFalling) return;
    if (!this.nearBoat(80)) {
      this.boatWarned = false;
      return;
    }
    if (this.nearBoat(36)) this.touchBoat();
  }

  touchBoat() {
    if (this.sailing || this.fighting || this.gateFalling) return;
    if (!this.shoreReady()) {
      if (!this.boatWarned) {
        this.boatWarned = true;
        this.game.events.emit('notice', 'Clear the Trojans first.');
      }
      return;
    }
    this.sail();
  }

  sail() {
    if (this.sailing) return;
    this.sailing = true;
    this.inputLocked = true;
    this.feet.setVelocity(0, 0);
    if (this.shipMark) this.shipMark.setVisible(false);
    const cam = this.cameras.main;
    cam.fadeOut(800, 0, 0, 0);
    this.time.delayedCall(700, () => {
      this.game.events.emit('levelComplete');
    });
  }

  removeGroup(group) {
    if (!group || group.gone) return;
    group.gone = true;
    for (const member of group.members) {
      member.sprite.destroy();
      member.shadow.destroy();
      if (member.blocker) member.blocker.destroy();
    }
    this.publishObjective();
  }

  spawnCityGroups() {
    if (this.groupsSpawned) return;
    this.groupsSpawned = true;
    const key = 'trojan-soldier';
    const tex = this.textures.get(key);
    if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const spot of CITY_GROUPS) {
      const members = [];
      const formation = GROUP_FORMATIONS[spot.count] || GROUP_FORMATIONS[4];
      for (let i = 0; i < spot.count; i += 1) {
        const place = formation[i % formation.length];
        const x = spot.x + place.dx;
        const y = spot.y + place.dy;
        const shadow = this.add.ellipse(x + 3, y + 1, 14, 5, 0x0c1424, 0.55);
        const sprite = this.add.sprite(x, y, key, 0).setOrigin(0.5, 1);
        // Each man faces his own way and breathes in place, out of step
        // with the others (playSoldierIdle adds a small random delay).
        playSoldierIdle(sprite, 'trojan', place.face);
        const depth = 7000 + y;
        shadow.setDepth(depth - 2);
        sprite.setDepth(depth);
        // A solid footprint at his feet. His head and shield can overlap
        // whoever stands behind him; y decides who is drawn in front.
        const blocker = addRect(this, this.soldierBlockers, x - 9, y - 12, 18, 12);
        members.push({ sprite, shadow, blocker, x, y });
      }
      this.cityGroups.push({ id: spot.id, x: spot.x, y: spot.y, members, gone: false });
    }
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

// "Press E" floats over his head. fitTroyCamera shrinks the 15px letters
// by 1/zoom, so they stay about 15 screen pixels instead of going blurry.
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
  const aimShip = scene.shoreReady && scene.shoreReady() && !scene.sailing;
  if ((scene.questDone && !aimShip) || scene.nearest?.id === 'gate' || scene.sailing) {
    arrow.style.display = 'none';
    return;
  }
  const gate = aimShip ? SHIP : GATE_MARK;
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

// Zoom 3 is the laptop view. A phone is narrower than a street, so pull
// back until the view is at least ~280 CSS pixels of the city. A desktop
// stays at 3 because its width / 280 is above that cap.
// The "Press E" letters are drawn at 15px and scaled by 1/zoom, so they
// stay about 15 screen pixels when the zoom changes. 15 * (1/3) * 3 = 15.
function fitTroyCamera(scene) {
  const cam = scene.cameras.main;
  const zoom = Math.min(3, Math.max(1.5, scene.scale.width / 280));
  cam.setZoom(zoom);
  if (scene.prompt) scene.prompt.setScale(1 / zoom);
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
      hero.anims.play(`hero-idle-${facing}`, true);
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

function addShip(scene) {
  if (!scene.textures.exists('ship')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0x2a180e, 1);
    g.fillEllipse(24, 48, 36, 56);
    g.fillStyle(0x6a4428, 1);
    g.fillEllipse(24, 46, 28, 46);
    g.fillStyle(0xc4a36a, 1);
    g.fillRect(22, 14, 4, 34);
    g.fillStyle(0xf6ead2, 1);
    g.fillTriangle(26, 16, 44, 28, 26, 42);
    g.fillStyle(0x8d5a32, 1);
    g.fillRect(12, 42, 24, 4);
    g.fillStyle(0x9ec8d8, 0.9);
    g.fillEllipse(24, 66, 30, 8);
    g.generateTexture('ship', 48, 72);
    g.destroy();
  }
  const ship = scene.add.image(SHIP.x, SHIP.y, 'ship').setOrigin(0.5, 0.62);
  const tex = scene.textures.get('ship');
  if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  ship.setDepth(7000 + SHIP.y);
  scene.ship = ship;
  const mark = scene.add.triangle(SHIP.x, SHIP.y - 52, 0, 14, 12, 14, 6, 0, 0xf0d48a);
  mark.setDepth(9100);
  mark.setVisible(false);
  scene.shipMark = mark;
  scene.tweens.add({
    targets: ship,
    y: SHIP.y + 3,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  scene.tweens.add({
    targets: mark,
    y: SHIP.y - 60,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

// The doors swing open quietly on their hinges, and the Greeks come in.
// The player stays in the city afterwards.
function playGateFall(scene, onDone) {
  const cam = scene.cameras.main;
  cam.stopFollow();
  cam.pan(480, GATE_VIEW_Y, 420, 'Sine.easeOut');
  openGateDoors(scene);
  // He steps back from the doors so the column has the road.
  scene.scriptedMove = {
    x: Phaser.Math.Clamp(scene.feet.x, 470, 490),
    y: HERO_STEP_BACK_Y,
    face: 's',
  };
  // The Greeks run in through the gate and pair off with Trojans (gateBattle.js).
  startGateBattle(scene);

  // Control comes back once every duelist is at his spot.
  scene.time.delayedCall(Math.max(2400, (scene.gateBattleMs || 0) + 250), () => {
    scene.scriptedMove = null;
    cam.startFollow(scene.feet, true, 0.16, 0.16);
    if (onDone) onDone();
  });
}

// Where Odysseus steps back to while the army runs through the gate: open
// paving up the middle, between the two duel flanks.
const HERO_STEP_BACK_Y = 516;

function openGateDoors(scene) {
  const door = scene.gateDoor;
  if (!door) return;
  const src = door.sprite;
  const x = src ? src.x : 480;
  const y = src ? src.y : 652;
  if (src) src.setVisible(false);
  if (door.blocker) door.blocker.destroy();
  // The closed doors cast a shadow on the road. Once they swing open there
  // is nothing left to cast it, so it fades out with them.
  if (door.shadow) {
    scene.tweens.add({
      targets: door.shadow,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeIn',
      onComplete: () => door.shadow.destroy(),
    });
  }
  // The Greeks open the gate quietly; nothing is broken. One picture holds
  // the two stone jambs and the two wooden leaves (128 px wide: jamb 0-8,
  // leaves 8-64 and 64-120, jamb 120-128). Each leaf slides sideways into
  // a pocket in the wall: it moves outward while the part that has passed
  // the jamb is cropped away, so it disappears behind the stone. The jambs
  // are drawn on top to cover the seam. Flat 2D, nothing tips toward us.
  const left = scene.add.image(x, y, 'gate-door').setOrigin(0.5, 1).setDepth(7420).setTint(NIGHT_TINT);
  const right = scene.add.image(x, y, 'gate-door').setOrigin(0.5, 1).setDepth(7420).setTint(NIGHT_TINT);
  for (const [cropX, cropW] of [[0, 8], [120, 8]]) {
    scene.add.image(x, y, 'gate-door').setOrigin(0.5, 1).setDepth(7421).setCrop(cropX, 0, cropW, 72)
      .setTint(NIGHT_TINT);
  }
  const LEAF = 56;
  // Leave a thin edge of each leaf showing in the opening, like a door
  // standing in its pocket.
  const SLIDE = LEAF - 4;
  const place = (d) => {
    left.setX(x - d).setCrop(8 + d, 0, LEAF - d, 72);
    right.setX(x + d).setCrop(64, 0, LEAF - d, 72);
  };
  place(0);
  scene.tweens.addCounter({
    from: 0,
    to: SLIDE,
    duration: 1300,
    ease: 'Sine.easeInOut',
    onUpdate: (tween) => place(Math.round(tween.getValue())),
  });
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
    horse.setTint(NIGHT_TINT);
  } else {
    // Same band as the horse and the people, so a roof covers whoever is behind it.
    sprite = scene.add.image(prop.x, prop.baseY, prop.id).setOrigin(0.5, 1).setDepth(7000 + prop.baseY);
    sprite.setTint(NIGHT_TINT);
  }
  const bottom = prop.baseY - prop.insetBottom;
  const blocker = group.create(prop.x, bottom - prop.bodyH / 2, 'blank');
  blocker.setDisplaySize(prop.bodyW, prop.bodyH);
  blocker.refreshBody();
  blocker.setVisible(false);
  if (prop.id === 'gate-door') scene.gateDoor = { sprite, blocker, shadow };
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
