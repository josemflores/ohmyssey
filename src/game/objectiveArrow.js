// A gold arrow that points the player to the current objective.
//
// Same look as the gate arrow in Troy (TroyScene aimArrow): a gold
// arrowhead drawn over the game. If the target is on screen, the arrow
// hovers above it and points down at it. If it is off screen, the arrow
// sits at the edge of the screen and points the way to go.
//
// Call updateObjectiveArrow(scene, target) every frame. target is a world
// point { x, y } (the spot to stand), or null to hide the arrow.

const ARROW_ID = 'objective-arrow';

function arrowElement(host) {
  let arrow = document.getElementById(ARROW_ID);
  if (!arrow) {
    arrow = document.createElement('div');
    arrow.id = ARROW_ID;
    arrow.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:2;pointer-events:none;';
    // The svg is centered on the arrow's anchor point, pointing right (0 rad).
    arrow.innerHTML = '<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" style="position:absolute;left:-32px;top:-32px;filter:drop-shadow(0 0 6px rgba(240,212,138,0.8))"><polygon points="4,10 58,32 4,54 18,32" fill="#f0d48a" stroke="#1a1208" stroke-width="3" stroke-linejoin="round"/></svg>';
    host.appendChild(arrow);
  }
  if (arrow.parentElement !== host) host.appendChild(arrow);
  return arrow;
}

export function hideObjectiveArrow() {
  const arrow = document.getElementById(ARROW_ID);
  if (arrow) arrow.style.display = 'none';
}

export function updateObjectiveArrow(scene, target) {
  const canvas = scene.game.canvas;
  const host = canvas?.parentElement;
  if (!host) return;
  const arrow = arrowElement(host);
  if (!target) {
    arrow.style.display = 'none';
    return;
  }
  const cam = scene.cameras.main;
  // Where the target is on screen, in CSS pixels of the canvas.
  const box = canvas.getBoundingClientRect();
  const hostBox = host.getBoundingClientRect();
  const k = box.width / cam.width; // canvas pixels to CSS pixels
  const sx = (cam.width * 0.5 + (target.x - cam.midPoint.x) * cam.zoom) * k;
  const sy = (cam.height * 0.5 + (target.y - cam.midPoint.y) * cam.zoom) * k;
  const w = box.width;
  const h = box.height;
  const ox = box.left - hostBox.left;
  const oy = box.top - hostBox.top;
  const margin = 48;
  const onScreen = sx > margin && sy > margin + 40 && sx < w - margin && sy < h - margin;
  let x;
  let y;
  let angle;
  if (onScreen) {
    // Hover above the target, bobbing a little, pointing straight down.
    const bob = Math.sin(scene.time.now / 220) * 6;
    x = sx;
    y = Math.max(margin, sy - 60 - 18 * cam.zoom + bob);
    angle = Math.PI / 2;
  } else {
    // Pin to the edge of the screen on the line from the center to the target.
    const cx = w / 2;
    const cy = h / 2;
    const dx = sx - cx;
    const dy = sy - cy;
    const scale = Math.min((cx - margin) / Math.abs(dx || 0.001), (cy - margin) / Math.abs(dy || 0.001));
    x = cx + dx * scale;
    y = cy + dy * scale;
    angle = Math.atan2(dy, dx);
  }
  arrow.style.display = 'block';
  arrow.style.transform = `translate(${Math.round(x + ox)}px, ${Math.round(y + oy)}px) rotate(${angle}rad)`;
}
