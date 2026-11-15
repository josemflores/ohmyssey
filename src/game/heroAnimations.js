// All three world scenes share these LPC action sheets. Movement still uses
// the existing walk cycle, so collision boxes and walking speed do not change.
export const HERO_ACTIONS = {
  idle: { file: 'idle_animation', size: 32, frames: 2, fps: 2, repeat: -1 },
  attack: { file: 'attack', size: 64, frames: 6, fps: 10, repeat: 0 },
  hit: { file: 'hit', size: 32, frames: 3, fps: 6, repeat: 0 },
};

const FACINGS = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];

export function loadHeroActions(scene) {
  for (const [name, action] of Object.entries(HERO_ACTIONS)) {
    const key = `odysseus-${name}`;
    if (scene.textures.exists(key)) continue;
    scene.load.spritesheet(key, `/assets/sprites/odysseus_${action.file}.png`, {
      frameWidth: action.size,
      frameHeight: action.size,
    });
  }
}

export function createHeroActions(scene) {
  for (const [name, action] of Object.entries(HERO_ACTIONS)) {
    FACINGS.forEach((facing, row) => {
      const key = `hero-${name}-${facing}`;
      // Phaser shares animations between the horse and Troy.
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(`odysseus-${name}`, {
          start: row * action.frames,
          end: (row + 1) * action.frames - 1,
        }),
        frameRate: action.fps,
        repeat: action.repeat,
      });
    });
  }
}
