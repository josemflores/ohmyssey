#!/usr/bin/env python3
"""Paint the battle backdrop for Troy: the city burning on the night it falls.

Octopath-style: the fight happens on a street of the same city you were just
walking, so the backdrop shows that street, the burning houses beside it, and
the citadel of Troy behind, with the temple of Athena at the top and smoke
rolling over the moon.

Accurate to the setting (same sources as the map, see textures.js):
  - sloping limestone walls with a mudbrick top and square towers,
  - flat-roofed houses of mudbrick on stone footings, packed up the hill,
  - Mount Ida on the horizon, a cobbled street in front.

The picture is pixel art, 480 x 270. The page scales it up with crisp pixels.
Run from the repo root (needs Pillow and numpy):

  python3 art/scripts/build_battle_backdrop.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "assets" / "battle" / "troy_burning.png"

W, H = 480, 270
HORIZON = 168  # where the street meets the foot of the citadel
rng = np.random.default_rng(1184)  # the traditional date of the sack, BC

# 4x4 ordered dither, so gradients turn into crisp pixel patterns.
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


def hexc(value: str) -> np.ndarray:
    value = value.lstrip("#")
    return np.array([int(value[i : i + 2], 16) for i in (0, 2, 4)], dtype=float)


img = np.zeros((H, W, 3), dtype=float)
# Fire light gathered from every flame, added on at the end.
light = np.zeros((H, W), dtype=float)


def dithered_mix(c0, c1, t, x, y):
    """Pick c0 or c1 per pixel, using the dither pattern as the threshold."""
    return c1 if t > BAYER[y % 4, x % 4] else c0


def rect(x0, y0, x1, y1, color):
    x0, y0 = max(0, int(x0)), max(0, int(y0))
    x1, y1 = min(W, int(x1)), min(H, int(y1))
    if x1 > x0 and y1 > y0:
        img[y0:y1, x0:x1] = color


def px(x, y, color):
    if 0 <= x < W and 0 <= y < H:
        img[int(y), int(x)] = color


def glow(cx, cy, radius, strength):
    """Add a soft round pool of firelight."""
    ys, xs = np.mgrid[0:H, 0:W]
    d = np.hypot(xs - cx, (ys - cy) * 1.15)
    light[:] += strength * np.clip(1 - d / radius, 0, 1) ** 2


# ---------------------------------------------------------------------------
# Sky: deep night at the top, turning smoky red near the burning city.
# ---------------------------------------------------------------------------
bands = [(0, "#0a0f22"), (60, "#15142c"), (105, "#2c1a30"), (140, "#5a2522"), (HORIZON, "#8a3a1e")]
for y in range(HORIZON):
    for i in range(len(bands) - 1):
        y0, c0 = bands[i]
        y1, c1 = bands[i + 1]
        if y0 <= y < y1:
            t = (y - y0) / (y1 - y0)
            a, b = hexc(c0), hexc(c1)
            for x in range(W):
                img[y, x] = dithered_mix(a, b, t, x, y)

# Stars, only high up where the smoke has not reached.
for _ in range(90):
    x, y = rng.integers(0, W), rng.integers(0, 70)
    img[y, x] = hexc("#cfd8ff") * (0.5 + rng.random() * 0.5)

# The moon, low on the right, half drowned in smoke later.
mx, my = 402, 44
for y in range(my - 15, my + 16):
    for x in range(mx - 15, mx + 16):
        d = np.hypot(x - mx, y - my)
        if d <= 14.5:
            shade = hexc("#f2ecd8") if x - mx < 6 else hexc("#d8cfb4")
            img[y, x] = shade
for cx, cy, r in [(397, 40, 3), (408, 50, 2), (404, 36, 1.5), (395, 52, 2)]:
    for y in range(int(cy - r), int(cy + r) + 1):
        for x in range(int(cx - r), int(cx + r) + 1):
            if np.hypot(x - cx, y - cy) <= r:
                img[y, x] = hexc("#c4b99c")

# Mount Ida on the horizon, far away and blue.
for x in range(W):
    ridge = 118 + 10 * np.sin(x / 47.0) + 6 * np.sin(x / 13.0 + 1.3) + 4 * np.sin(x / 7.1)
    for y in range(int(ridge), HORIZON):
        t = (y - ridge) / max(1, HORIZON - ridge)
        img[y, x] = dithered_mix(hexc("#2a2440"), hexc("#3a2436"), t, x, y)

# ---------------------------------------------------------------------------
# The citadel: a mound, the sloping wall, towers, packed houses, the temple.
# ---------------------------------------------------------------------------
STONE_MOON = hexc("#7a7c96")  # limestone in moonlight
STONE_LIT = hexc("#c8946a")  # limestone lit by fire from below
STONE_DARK = hexc("#3c3448")
BRICK = hexc("#8a5a46")
BRICK_DARK = hexc("#4a3036")
ROOF = hexc("#6e5a58")
WINDOW = hexc("#ffb050")


def wall_strip(x0, x1, top, bottom, seed):
    """Ashlar wall that leans back (sloped), moonlit at the top, firelit below."""
    r = np.random.default_rng(seed)
    for y in range(top, bottom):
        t = (y - top) / max(1, bottom - top)
        slope = int(t * 4)  # the foot of the wall steps outward
        for x in range(x0 - slope, x1 + slope):
            img[y, x] = dithered_mix(STONE_MOON, STONE_LIT, t * 1.1, x, y)
    # Block joints.
    for y in range(top + 3, bottom, 5):
        offset = (y // 5) % 2 * 4
        for x in range(x0, x1):
            img[y, x] = img[y, x] * 0.62
        for x in range(x0 + offset, x1, 9 + r.integers(0, 3)):
            for yy in range(y - 4, y):
                img[yy, x] = img[yy, x] * 0.7
    # Mudbrick breastwork with merlons on top.
    rect(x0, top - 4, x1, top, BRICK)
    for x in range(x0, x1, 6):
        rect(x, top - 7, x + 3, top - 4, BRICK)
        rect(x + 3, top - 7, x + 6, top - 4, hexc("#1c1428"))


def tower(cx, top, bottom, w=16):
    x0, x1 = cx - w // 2, cx + w // 2
    wall_strip(x0, x1, top, bottom, cx)
    rect(x0, top - 10, x1, top - 4, BRICK)
    for x in range(x0, x1, 5):
        rect(x, top - 13, x + 3, top - 10, BRICK)
    rect(cx - 1, top + 6, cx + 2, top + 11, hexc("#1c1018"))
    px(cx, top + 8, WINDOW)


def house_block(x0, y_base, w, h, burning, seed):
    """A flat-roofed mudbrick house on the hill, seen from the street below."""
    r = np.random.default_rng(seed)
    top = y_base - h
    for y in range(top, y_base):
        for x in range(x0, x0 + w):
            t = (y - top) / max(1, h)
            img[y, x] = dithered_mix(BRICK_DARK, BRICK, 0.35 + t * 0.5, x, y)
    rect(x0 - 1, top - 2, x0 + w + 1, top, ROOF)
    # Beam ends under the roof edge.
    for x in range(x0 + 1, x0 + w - 1, 3):
        px(x, top, hexc("#2a1810"))
    # Small high windows. Some glow with fire inside.
    for wx in range(x0 + 2, x0 + w - 2, 5):
        if r.random() < 0.6:
            rect(wx, top + 2, wx + 2, top + 4, WINDOW if (burning or r.random() < 0.5) else hexc("#1a1420"))
    if burning:
        flames(x0 + w // 2, top - 1, w * 0.7, h * 0.9 + 6, seed)


def flames(cx, base, width, height, seed):
    """A tongue of fire: dark red outside, orange, yellow, a white-hot core."""
    r = np.random.default_rng(seed)
    layers = [(1.0, "#a8241a"), (0.78, "#e8521c"), (0.55, "#ff9a2e"), (0.32, "#ffd864"), (0.14, "#fff6d0")]
    for scale, color in layers:
        c = hexc(color)
        hw = width * scale / 2
        hh = height * scale
        for y in range(int(base - hh), int(base) + 1):
            t = min(1.0, (base - y) / max(1, hh))  # 0 at the base, 1 at the tip
            wobble = np.sin(y * 0.7 + seed) * 1.5 + r.normal() * 0.6
            half = hw * (1 - t) ** 0.8
            for x in range(int(cx - half + wobble), int(cx + half + wobble) + 1):
                if 0 <= x < W and 0 <= y < H:
                    img[y, x] = c
    # A few loose tongues licking up.
    for _ in range(4):
        tx = cx + r.normal() * width * 0.25
        th = height * (0.4 + r.random() * 0.5)
        for y in range(int(base - height - th * 0.3), int(base - height * 0.6)):
            px(tx + np.sin(y) * 0.8, y, hexc("#ff9a2e"))
    glow(cx, base - height * 0.4, max(40, width * 3.2), 0.75)


# The mound under the citadel.
for x in range(W):
    top = 112 + 0.0012 * (x - 240) ** 2
    for y in range(int(top), HORIZON):
        img[y, x] = dithered_mix(hexc("#2a1e2a"), hexc("#4a2a26"), (y - top) / 40, x, y)

# Houses packed up the slope, back rows first. Several are burning.
rows = [
    (104, range(150, 330, 15), 0.35),
    (118, range(120, 360, 17), 0.45),
    (132, range(90, 390, 19), 0.5),
]
seed = 7
for base, xs, burn_chance in rows:
    for x0 in xs:
        seed += 13
        r = np.random.default_rng(seed)
        house_block(x0 + int(r.integers(-3, 3)), base + int(r.integers(0, 4)), 12 + int(r.integers(0, 5)), 8 + int(r.integers(0, 6)), r.random() < burn_chance, seed)

# The temple of Athena on the summit.
tx, ty = 240, 92
rect(tx - 22, ty, tx + 22, ty + 4, STONE_LIT)
for c in range(tx - 18, tx + 19, 6):
    rect(c, ty - 12, c + 2, ty, hexc("#d8c2a8"))
rect(tx - 22, ty - 15, tx + 22, ty - 12, hexc("#c8b298"))
for y in range(ty - 24, ty - 15):
    half = (y - (ty - 24)) * 2.4
    rect(tx - half, y, tx + half, y + 1, hexc("#8a3a2e"))
rect(tx - 4, ty - 10, tx + 4, ty, hexc("#2a1418"))
px(tx, ty - 5, WINDOW)
flames(tx + 14, ty - 15, 10, 16, 99)

# The great wall in front of the houses, with towers.
wall_strip(70, 410, 140, HORIZON, 3)
for cx in (96, 168, 312, 384):
    tower(cx, 128, HORIZON)
# The Scaean gate tower, bigger, in the middle, its doors open.
tower(240, 122, HORIZON, 28)
rect(232, 146, 248, HORIZON, hexc("#1a0c10"))
glow(240, 160, 40, 0.5)

# ---------------------------------------------------------------------------
# Smoke rolling up from the fires and drifting right, over the moon.
# ---------------------------------------------------------------------------
def smoke_column(x, base, height, drift, seed):
    r = np.random.default_rng(seed)
    for i in range(int(height / 3)):
        t = i / (height / 3)
        cx = x + drift * t * t * height + r.normal() * 2
        cy = base - i * 3
        radius = 5 + t * 20 + r.random() * 4
        lit = max(0.0, 1 - t * 2.2)  # orange underlight near the fire
        col = hexc("#3a2e34") * (1 - lit) + hexc("#8a4a2a") * lit
        for y in range(int(cy - radius), int(cy + radius) + 1):
            for xx in range(int(cx - radius), int(cx + radius) + 1):
                if 0 <= xx < W and 0 <= y < H:
                    d = np.hypot(xx - cx, y - cy) / radius
                    if d < 1:
                        a = (1 - d) * 0.85 * (1 - t * 0.45)
                        if a > BAYER[y % 4, xx % 4] * 0.6:
                            img[y, xx] = img[y, xx] * (1 - a) + col * a


for i, (sx, sb) in enumerate([(130, 120), (190, 102), (262, 92), (318, 112), (360, 126), (60, 150), (440, 146)]):
    smoke_column(sx, sb, 120 + i * 9, 0.55, 300 + i)

# ---------------------------------------------------------------------------
# Burning houses on both sides of the street, close up (the frame).
# ---------------------------------------------------------------------------
def big_house(x0, x1, roof_y, seed, mirror):
    r = np.random.default_rng(seed)
    base = 214
    # Pixel loops stay on the canvas; rect() and flames() clip on their own.
    cx0, cx1 = max(0, x0), min(W, x1)
    # Stone socle.
    for y in range(base - 22, base):
        for x in range(cx0, cx1):
            img[y, x] = dithered_mix(hexc("#4a3a40"), hexc("#a8785a"), (y - (base - 22)) / 26, x, y)
    for y in range(base - 22, base, 6):
        rect(x0, y, x1, y + 1, hexc("#2a1e24"))
        for x in range(x0 + (y // 6) % 2 * 5, x1, 11):
            rect(x, y, x + 1, y + 6, hexc("#2a1e24"))
    # Mudbrick wall with a timber band.
    for y in range(roof_y, base - 22):
        for x in range(cx0, cx1):
            img[y, x] = dithered_mix(hexc("#4a2c2a"), hexc("#b0704c"), 0.25 + (y - roof_y) / (base - roof_y), x, y)
    for y in range(roof_y + 4, base - 22, 4):
        rect(x0, y, x1, y + 1, hexc("#3a2220"))
    rect(x0, base - 30, x1, base - 27, hexc("#5a3420"))
    # Beam ends and the roof edge.
    rect(x0 - 2, roof_y - 4, x1 + 2, roof_y, hexc("#5a4440"))
    for x in range(x0, x1, 7):
        rect(x, roof_y, x + 3, roof_y + 3, hexc("#3a2214"))
    # A doorway full of fire, and a window.
    door_x = x1 - 26 if not mirror else x0 + 12
    rect(door_x, base - 30, door_x + 14, base, hexc("#2a1010"))
    rect(door_x + 2, base - 26, door_x + 12, base, hexc("#ff8a2a"))
    rect(door_x + 4, base - 20, door_x + 10, base, hexc("#ffd060"))
    win_x = x0 + 14 if not mirror else x1 - 24
    rect(win_x, roof_y + 10, win_x + 10, roof_y + 18, hexc("#2a1010"))
    rect(win_x + 2, roof_y + 12, win_x + 8, roof_y + 18, hexc("#ff9a2e"))
    glow(door_x + 7, base - 10, 70, 0.9)
    # The roof is ablaze.
    for k in range(4):
        fx = x0 + (x1 - x0) * (0.15 + 0.23 * k) + r.normal() * 3
        flames(fx, roof_y - 3, 18 + r.random() * 10, 26 + r.random() * 22, seed + k)
    smoke_column(int((x0 + x1) / 2), roof_y - 30, 150, 0.5 if not mirror else 0.35, seed + 50)



# ---------------------------------------------------------------------------
# The street: cobbles in perspective, warm where the fire reaches them.
# ---------------------------------------------------------------------------
y = HORIZON
row = 0
while y < H:
    h = 2 + row // 2  # rows get taller toward the viewer
    w = 6 + row
    offset = (row % 2) * (w // 2)
    for x in range(-w, W + w, w):
        sx = x + offset
        shade = 0.75 + 0.25 * np.random.default_rng(row * 1000 + x + 100).random()
        base_col = hexc("#6a5a5a") * shade
        for yy in range(y, min(H, y + h)):
            for xx in range(sx + 1, sx + w):
                if 0 <= xx < W:
                    img[yy, xx] = base_col
        # Joints, and a pale top edge on each stone.
        for xx in range(sx, sx + w):
            if 0 <= xx < W and y < H:
                img[y, xx] = hexc("#2a2028")
                if y + 1 < H and xx > sx:
                    img[y + 1, xx] = base_col * 1.18
        for yy in range(y, min(H, y + h)):
            if 0 <= sx < W:
                img[yy, sx] = hexc("#2a2028")
    y += h + 1
    row += 1

# A light ash haze where the street meets the wall.
for y in range(HORIZON, HORIZON + 10):
    a = 0.35 * (1 - (y - HORIZON) / 10)
    img[y] = img[y] * (1 - a) + hexc("#6a3a2a") * a

# Debris: broken jars and a dropped spear on the street.
for (bx, by) in [(150, 238), (322, 246), (200, 256)]:
    rect(bx, by, bx + 6, by + 3, hexc("#a8683a"))
    rect(bx + 1, by - 1, bx + 4, by, hexc("#d08c52"))
    rect(bx + 7, by + 1, bx + 10, by + 3, hexc("#8a5028"))
for i in range(40):
    px(268 + i, 230 + i // 6, hexc("#5a3a22"))
rect(306, 235, 310, 238, hexc("#c8c0b0"))

# The two burning houses frame the street, drawn last so they stand in front.
big_house(-6, 104, 128, 501, False)
big_house(378, 490, 136, 777, True)

# ---------------------------------------------------------------------------
# Firelight, embers, and a dark frame around the edges.
# ---------------------------------------------------------------------------
fire_tint = hexc("#ff8a3a") / 255.0
lit = np.clip(light, 0, 1.4)[..., None]
img = img + img * lit * fire_tint * 1.1 + lit * fire_tint * 38

for _ in range(260):
    x, y = rng.integers(0, W), rng.integers(20, H - 10)
    c = hexc("#ffd060") if rng.random() < 0.5 else hexc("#ff7a2a")
    img[y, x] = c
    if rng.random() < 0.3 and y > 0:
        img[y - 1, x] = c * 0.6

ys, xs = np.mgrid[0:H, 0:W]
d = np.hypot((xs - W / 2) / (W / 2), (ys - H * 0.55) / (H * 0.62))
vignette = np.clip(1.15 - d * 0.55, 0.45, 1.0)[..., None]
img = img * vignette

OUT.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB").save(OUT, optimize=True)
print(f"wrote {OUT.relative_to(ROOT)} ({W}x{H})")
