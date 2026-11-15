// Idle, attack, and hit animations for the Greek and Trojan soldiers.
// Works like heroAnimations.js does for Odysseus.
//
// The sheets come from art/scripts/build_soldiers_lpc.py. Each one is a strip
// of 32x32 frames, grouped by facing in this order: s, se, e, ne, n, nw, w, sw.
//
// Use it in a scene:
//   preload() { loadSoldierActions(this); }
//   create()  { createSoldierActions(this); }
//   then      sprite.play(soldierAnim('trojan', 'idle', 's'));

const FACINGS = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];

// frames = how many frames each facing has in the strip.
const ACTIONS = {
  idle: { file: 'idle_animation', frames: 2, fps: 2, repeat: -1 },
  attack: { file: 'attack', frames: 6, fps: 10, repeat: 0 },
  hit: { file: 'hit', frames: 3, fps: 6, repeat: 0 },
};

const TEAMS = ['greek', 'trojan'];

// Texture key for one team's action sheet, e.g. 'trojan-lpc-idle'.
function sheetKey(team, action) {
  return `${team}-lpc-${action}`;
}

// Animation key, e.g. 'trojan-idle-s'.
export function soldierAnim(team, action, facing = 's') {
  return `${team}-${action}-${facing}`;
}

export function loadSoldierActions(scene) {
  for (const team of TEAMS) {
    for (const [action, spec] of Object.entries(ACTIONS)) {
      const key = sheetKey(team, action);
      if (scene.textures.exists(key)) continue;
      scene.load.spritesheet(key, `/assets/sprites/npcs/${team}_lpc/${team}_${spec.file}.png`, {
        frameWidth: 32,
        frameHeight: 32,
      });
    }
  }
}

export function createSoldierActions(scene) {
  for (const team of TEAMS) {
    for (const [action, spec] of Object.entries(ACTIONS)) {
      const key = sheetKey(team, action);
      if (!scene.textures.exists(key)) continue;
      FACINGS.forEach((facing, index) => {
        const anim = soldierAnim(team, action, facing);
        // Animations are global in Phaser, so the horse and Troy share them.
        if (scene.anims.exists(anim)) return;
        scene.anims.create({
          key: anim,
          frames: scene.anims.generateFrameNumbers(key, {
            start: index * spec.frames,
            end: (index + 1) * spec.frames - 1,
          }),
          frameRate: spec.fps,
          repeat: spec.repeat,
        });
      });
    }
  }
}

// Walk cycles come from the 4x8 walk sheets that TroyScene loads as
// 'greek-hoplite' and 'trojan-soldier'. Their rows are in a different order:
// S, SW, W, NW, N, NE, E, SE, four frames each.
const WALK_SHEETS = { greek: 'greek-hoplite', trojan: 'trojan-soldier' };
const WALK_ROWS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'];

// Animation key for a walk, e.g. 'greek-walk-n'. Call createSoldierWalks first.
export function soldierWalk(team, facing) {
  return `${team}-walk-${facing}`;
}

export function createSoldierWalks(scene) {
  for (const [team, sheet] of Object.entries(WALK_SHEETS)) {
    if (!scene.textures.exists(sheet)) continue;
    WALK_ROWS.forEach((facing, row) => {
      const key = soldierWalk(team, facing);
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(sheet, { start: row * 4, end: row * 4 + 3 }),
        frameRate: 10,
        repeat: -1,
      });
    });
  }
}

// Which of the eight facings points along (dx, dy). Screen y grows downward.
export function facingToward(dx, dy) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ay >= ax * 1.6) return dy < 0 ? 'n' : 's';
  if (ax >= ay * 1.6) return dx < 0 ? 'w' : 'e';
  if (dy < 0) return dx < 0 ? 'nw' : 'ne';
  return dx < 0 ? 'sw' : 'se';
}

// A slow breath for a standing soldier, on top of his idle frames: he rises
// a little taller and narrower and settles back, feet planted (origin is at
// his feet). Each man gets his own pace and starting point so a crowd never
// moves in lockstep. Safe to call more than once on the same sprite.
export function addBreathing(sprite) {
  if (!sprite || sprite.breathing) return;
  sprite.breathing = sprite.scene.tweens.add({
    targets: sprite,
    scaleY: { from: sprite.scaleY, to: sprite.scaleY * 1.035 },
    scaleX: { from: sprite.scaleX, to: sprite.scaleX * 0.98 },
    duration: 900 + Math.random() * 500,
    delay: Math.random() * 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

// Start a soldier breathing in place. A small random delay keeps a group
// from breathing in perfect lockstep.
export function playSoldierIdle(sprite, team, facing = 's') {
  const key = soldierAnim(team, 'idle', facing);
  if (!sprite.scene.anims.exists(key)) return;
  sprite.play({ key, delay: Math.floor(Math.random() * 400) });
  addBreathing(sprite);
}
