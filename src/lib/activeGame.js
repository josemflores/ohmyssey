// The Phaser game that is on screen right now, so React overlays (the pause
// menu) can pause it without each world wiring its own events.
// A world screen calls setActiveGame(game) when it mounts and
// clearActiveGame(game) when it unmounts.

let current = null;

export function setActiveGame(game) {
  current = game;
}

export function clearActiveGame(game) {
  if (current === game) current = null;
}

export function getActiveGame() {
  return current;
}

// Freeze the world. The keyboard manager is switched off too, so typing in
// the pause menu (W, A, S, D, E) is not swallowed by Phaser's key capture.
export function pauseActiveGame() {
  const game = current;
  if (!game || game.isPaused) return;
  if (game.input?.keyboard) game.input.keyboard.enabled = false;
  game.pause();
}

export function resumeActiveGame() {
  const game = current;
  if (!game) return;
  if (game.input?.keyboard) game.input.keyboard.enabled = true;
  // Keys held while the menu was open would otherwise stay "down".
  for (const scene of game.scene.getScenes(true)) scene.input?.keyboard?.resetKeys();
  if (game.isPaused) game.resume();
}

// Dev: draw every physics box in the scenes that are running.
export function setHitboxes(on) {
  const game = current;
  if (!game) return;
  for (const scene of game.scene.getScenes(true)) {
    const world = scene.physics?.world;
    if (!world) continue;
    world.drawDebug = on;
    if (on && !world.debugGraphic) world.createDebugGraphic();
    if (world.debugGraphic) {
      world.debugGraphic.clear();
      world.debugGraphic.setVisible(on);
      world.debugGraphic.setDepth(20000);
    }
  }
}
