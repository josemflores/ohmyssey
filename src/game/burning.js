// Setting a house on fire: flames on the roof, a pool of firelight on the
// street, smoke rolling up, and sparks. Used by gateBattle.js when a Greek
// torch-bearer reaches a house. Once lit, a house burns for the rest of the
// level (nothing puts it out; the city is falling).
//
// The fire is only a picture. It does not hurt anyone or block the way any
// more than the house already does.

import Phaser from 'phaser';

const FIRE_ANIM = 'fire-burn';

// The house pictures are 60 wide and 64 tall, standing on (x, baseY).
// The flat roof is the top 30 pixels.
const ROOF_TOP = 62;
const ROOF_BOTTOM = 34;

function ensureFireAnim(scene) {
  if (scene.anims.exists(FIRE_ANIM) || !scene.textures.exists('fire')) return;
  scene.anims.create({
    key: FIRE_ANIM,
    frames: scene.anims.generateFrameNumbers('fire', { start: 0, end: 3 }),
    frameRate: 9,
    repeat: -1,
  });
}

// A small flame for a torch-bearer to carry. Call follow each frame he moves.
export function addTorch(scene, man) {
  ensureFireAnim(scene);
  if (!scene.textures.exists('fire')) return null;
  const flame = scene.add.sprite(man.sprite.x + 6, man.sprite.y - 24, 'fire', 0)
    .setOrigin(0.5, 1)
    .setScale(0.45)
    .setAlpha(man.sprite.alpha);
  flame.play({ key: FIRE_ANIM, startFrame: Phaser.Math.Between(0, 3) });
  const glow = scene.add.image(flame.x, flame.y - 4, 'lamp-glow')
    .setBlendMode(Phaser.BlendModes.ADD)
    .setScale(0.35)
    .setAlpha(0.5)
    .setDepth(5400);
  const torch = {
    flame,
    glow,
    follow() {
      flame.setPosition(man.sprite.x + 6, man.sprite.y - 22);
      flame.setDepth(man.sprite.depth + 1);
      flame.setAlpha(man.sprite.alpha);
      glow.setPosition(flame.x, flame.y - 4);
    },
    drop() {
      flame.destroy();
      glow.destroy();
    },
  };
  torch.follow();
  return torch;
}

// Find the picture of a house standing at (x, baseY), to warm its color.
function housePicture(scene, house) {
  return scene.children.list.find(
    (child) => child.texture
      && (child.texture.key === 'house' || child.texture.key === 'houseAlt')
      && Math.abs(child.x - house.x) < 1
      && Math.abs(child.y - house.baseY) < 1,
  );
}

// Light the roof of one house. `house` is its PROPS entry ({ x, baseY }).
export function igniteHouse(scene, house) {
  ensureFireAnim(scene);
  if (!scene.textures.exists('fire')) return;
  const depth = 7000 + house.baseY + 2;

  // Flames spread across the roof one after another, not all at once.
  const spots = [
    { dx: -16, dy: 44, s: 1.0 },
    { dx: 4, dy: 50, s: 1.25 },
    { dx: 18, dy: 42, s: 0.95 },
    { dx: -4, dy: 38, s: 0.8 },
    { dx: 12, dy: 56, s: 0.85 },
  ];
  spots.forEach((spot, index) => {
    const y = house.baseY - Phaser.Math.Clamp(spot.dy, ROOF_BOTTOM, ROOF_TOP);
    const flame = scene.add.sprite(house.x + spot.dx, y, 'fire', 0)
      .setOrigin(0.5, 1)
      .setDepth(depth)
      .setScale(0);
    flame.play({ key: FIRE_ANIM, startFrame: index % 4 });
    scene.tweens.add({
      targets: flame,
      scale: spot.s,
      delay: index * 260,
      duration: 500,
      ease: 'Back.easeOut',
    });
  });

  // Warm, flickering light on the street and the walls around the house.
  const glow = scene.add.image(house.x, house.baseY - 30, 'lamp-glow')
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(5400)
    .setScale(0.4)
    .setAlpha(0);
  scene.tweens.add({ targets: glow, alpha: 0.85, scale: 1.7, duration: 1200 });
  scene.tweens.add({
    targets: glow,
    alpha: { from: 0.65, to: 0.95 },
    scale: { from: 1.6, to: 1.8 },
    delay: 1200,
    duration: 380,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  // The house itself takes on the firelight.
  const picture = housePicture(scene, house);
  if (picture) picture.setTint(0xffd0a8);

  // Smoke and sparks keep coming for as long as the level lasts.
  scene.time.addEvent({
    delay: 260,
    loop: true,
    callback: () => puff(scene, house, depth),
  });
}

function puff(scene, house, depth) {
  const x = house.x + Phaser.Math.Between(-20, 20);
  const y = house.baseY - Phaser.Math.Between(48, 64);
  if (Math.random() < 0.7 && scene.textures.exists('smoke')) {
    const smoke = scene.add.image(x, y, 'smoke')
      .setDepth(depth + 1)
      .setScale(0.5)
      .setAlpha(0.75);
    scene.tweens.add({
      targets: smoke,
      x: x + Phaser.Math.Between(6, 22), // the night wind blows east
      y: y - Phaser.Math.Between(40, 70),
      scale: Phaser.Math.FloatBetween(1.4, 2.2),
      alpha: 0,
      duration: Phaser.Math.Between(1800, 2600),
      onComplete: () => smoke.destroy(),
    });
  } else {
    const spark = scene.add.rectangle(x, y + 6, 1, 1, Math.random() < 0.5 ? 0xffd060 : 0xff8a3a)
      .setDepth(depth + 1);
    scene.tweens.add({
      targets: spark,
      x: x + Phaser.Math.Between(-8, 14),
      y: y - Phaser.Math.Between(24, 48),
      alpha: 0,
      duration: Phaser.Math.Between(700, 1200),
      onComplete: () => spark.destroy(),
    });
  }
}
