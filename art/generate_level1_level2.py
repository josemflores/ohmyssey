#!/usr/bin/env python3
"""Generate Ohmyssey Level 1 and Level 2 character and palace sprites.

Level 1 is the Fall of Troy. Level 2 is the Return to Ithaca.
Jose places these on the Tiled maps. Kevin wires them in Phaser.

Sheets match art/generate_level3_level4.py and public/assets/sprites/sheet.json:
  32x32 frames, 4 walk frames by 8 directions
  (S, SW, W, NW, N, NE, E, SE), origin bottom-center.
  Feet sit on the same line as the siren and the crew (y=26 of 32).

Does not replace the PixelLab idle armies already used for the beach ranks
and the gate sentries:
  public/assets/sprites/soldier_red_greek.png
  public/assets/sprites/soldier_teal_trojan.png
Those stay 8 idle frames, one per facing, in a different order.

Requires Pillow. Does not touch src/, maps, package.json, or api/.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

INK = (36, 28, 20, 255)
PARCHMENT = (246, 234, 210, 255)
PARCHMENT_DEEP = (214, 184, 138, 255)
LINE = (196, 163, 106, 255)
SEA_DEEP = (14, 44, 60, 255)
SEA = (22, 72, 94, 255)
SEA_MID = (31, 109, 134, 255)
SEA_LIGHT = (64, 168, 186, 255)
GOLD = (196, 150, 60, 255)
GOLD_BRIGHT = (240, 212, 138, 255)
GOLD_DARK = (132, 88, 32, 255)
TERRACOTTA = (156, 59, 46, 255)
TERRACOTTA_DARK = (104, 34, 26, 255)
TERRACOTTA_HOT = (178, 74, 58, 255)
LAUREL = (47, 107, 69, 255)
LAUREL_LIGHT = (96, 168, 108, 255)
LAUREL_DARK = (24, 68, 40, 255)
BRONZE = (176, 116, 52, 255)
BRONZE_DARK = (104, 66, 30, 255)
BRONZE_LIGHT = (220, 168, 92, 255)
BRONZE_EDGE = (64, 40, 20, 255)
DECK = (156, 104, 58, 255)
DECK_DARK = (96, 60, 32, 255)
DECK_LIGHT = (196, 142, 86, 255)
HULL = (92, 58, 36, 255)
SKIN = (232, 184, 140, 255)
SKIN_SHADOW = (190, 132, 96, 255)
WHITE = (255, 250, 242, 255)
WINE = (92, 28, 36, 255)
WINE_DARK = (58, 16, 24, 255)
FLAME = (226, 120, 42, 255)
FLAME_DEEP = (168, 64, 28, 255)
TAN = (176, 122, 74, 255)
TAN_DARK = (110, 70, 40, 255)
TAN_LIGHT = (214, 164, 108, 255)
HAIR_BROWN = (96, 58, 32, 255)
HAIR_BROWN_DARK = (58, 34, 20, 255)
HAIR_LIGHT = (168, 112, 64, 255)
SHADOW = (10, 16, 24, 90)
CLEAR = (0, 0, 0, 0)

DIRS = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"]

# Same facing offsets as the Level 3 generator.
FACING = {
    "S": dict(head=0, body=0, face="front"),
    "SW": dict(head=-3, body=-1, face="front"),
    "W": dict(head=-5, body=-2, face="left"),
    "NW": dict(head=-3, body=-1, face="back"),
    "N": dict(head=0, body=0, face="back"),
    "NE": dict(head=3, body=1, face="back"),
    "E": dict(head=5, body=2, face="right"),
    "SE": dict(head=3, body=1, face="front"),
}


def px(img, x, y, color):
    if color is None or color[3] == 0:
        return
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((int(x), int(y)), color)


def rect(img, x, y, w, h, color):
    for yy in range(int(y), int(y + h)):
        for xx in range(int(x), int(x + w)):
            px(img, xx, yy, color)


def ellipse(img, cx, cy, rx, ry, color):
    if rx <= 0 or ry <= 0:
        return
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                px(img, x, y, color)


def line(img, x0, y0, x1, y1, color):
    x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
    dx, dy = abs(x1 - x0), abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    while True:
        px(img, x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x0 += sx
        if e2 < dx:
            err += dx
            y0 += sy


def outline(img):
    """1px ink ring around opaque pixels. Shadows (alpha < 200) are ignored."""
    src = img.copy()
    w, h = img.size
    sp = src.load()
    dp = img.load()
    for y in range(h):
        for x in range(w):
            if sp[x, y][3] > 200:
                continue
            solid = False
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and sp[nx, ny][3] > 200:
                    solid = True
                    break
            if solid and dp[x, y][3] < 200:
                dp[x, y] = INK
    return img


def _robe(img, ox, y0, color, dark, light, wide=6):
    for i, y in enumerate(range(y0, y0 + 10)):
        half = wide - i // 4
        for x in range(ox - half, ox + half + 1):
            px(img, x, y, color)
        px(img, ox - half, y, light)
        px(img, ox + half, y, dark)
    for x in range(ox - 4, ox + 5):
        px(img, x, y0 + 9, dark)


def _face(img, hx, hy, mode):
    if mode == "back":
        return
    eye_y = hy + 1
    if mode == "front":
        px(img, hx - 2, eye_y, INK)
        px(img, hx + 2, eye_y, INK)
        px(img, hx - 2, eye_y - 1, INK)
        px(img, hx + 2, eye_y - 1, INK)
        px(img, hx, eye_y + 2, TERRACOTTA)
        px(img, hx - 3, eye_y + 1, SKIN_SHADOW)
        px(img, hx + 3, eye_y + 1, SKIN_SHADOW)
    elif mode == "left":
        px(img, hx - 2, eye_y, INK)
        px(img, hx - 2, eye_y - 1, INK)
        px(img, hx - 4, eye_y + 1, SKIN_SHADOW)
        px(img, hx - 1, eye_y + 2, TERRACOTTA)
    elif mode == "right":
        px(img, hx + 2, eye_y, INK)
        px(img, hx + 2, eye_y - 1, INK)
        px(img, hx + 4, eye_y + 1, SKIN_SHADOW)
        px(img, hx + 1, eye_y + 2, TERRACOTTA)


def draw_feet(img, cx, y, frame, face, kind):
    """Boots or sandals on the shared ground line. y is 26 + bob."""
    if kind == "greave":
        light, mid, dark = BRONZE_LIGHT, BRONZE, BRONZE_DARK
    else:
        light, mid, dark = SKIN, SKIN_SHADOW, DECK_DARK

    if face == "right":
        sign = 1
    elif face == "left":
        sign = -1
    else:
        sign = 0

    if sign:
        # Stride along the facing axis so the side view actually walks.
        if frame == 0:
            spots = [(cx + sign * 4, y, light), (cx - sign * 3, y, mid)]
        elif frame == 2:
            spots = [(cx - sign * 3, y, mid), (cx + sign * 4, y - 1, light)]
        elif frame == 1:
            spots = [(cx + sign, y, light), (cx - sign, y, mid)]
        else:
            spots = [(cx - sign, y, mid), (cx + sign * 2, y, light)]
        for x, yy, col in spots:
            rect(img, x, yy - 1, 2, 2, col)
            if kind == "sandal":
                px(img, x, yy - 2, dark)
        return

    if frame == 0:
        pairs = [(cx - 6, light), (cx + 3, mid)]
    elif frame == 2:
        pairs = [(cx - 3, mid), (cx + 5, light)]
    elif frame == 1:
        pairs = [(cx - 4, light), (cx + 2, mid)]
    else:
        pairs = [(cx - 2, mid), (cx + 4, light)]
    for x, col in pairs:
        rect(img, x, y - 1, 3, 2, col)
        px(img, x, y, dark)
        px(img, x + 2, y, dark)
        if kind == "sandal":
            px(img, x, y - 2, dark)
            px(img, x + 1, y - 2, dark)


def draw_beard(img, hx, hy, face, color, dark):
    """Sits on the chest so it still reads after the robe is drawn."""
    if face == "front":
        ellipse(img, hx, hy + 5, 3, 3, color)
        ellipse(img, hx, hy + 6, 2, 2, dark)
        px(img, hx, hy + 8, dark)
        px(img, hx - 1, hy + 7, color)
        px(img, hx + 1, hy + 7, color)
    elif face == "left":
        ellipse(img, hx - 1, hy + 4, 3, 3, color)
        px(img, hx - 3, hy + 5, dark)
        px(img, hx - 2, hy + 7, dark)
    elif face == "right":
        ellipse(img, hx + 1, hy + 4, 3, 3, color)
        px(img, hx + 3, hy + 5, dark)
        px(img, hx + 2, hy + 7, dark)


def draw_wreath(img, hx, y, color, light):
    for dx in range(-5, 6):
        px(img, hx + dx, y, color if abs(dx) % 2 == 0 else light)
    px(img, hx - 5, y - 1, light)
    px(img, hx - 2, y - 1, light)
    px(img, hx + 2, y - 1, light)
    px(img, hx + 5, y - 1, light)
    px(img, hx - 4, y + 1, color)
    px(img, hx + 4, y + 1, color)


def draw_fillet(img, hx, y):
    for dx in range(-4, 5):
        px(img, hx + dx, y, GOLD)
    px(img, hx, y - 1, GOLD_BRIGHT)


def draw_tall_crest(img, hx, hy, face, flutter):
    color, dark = TERRACOTTA_HOT, TERRACOTTA_DARK
    if face in ("front", "back"):
        for i in range(5):
            y = hy - 5 - i
            px(img, hx + flutter, y, color if i % 2 == 0 else dark)
            px(img, hx - 1 + flutter, y, dark)
            px(img, hx + 1 + flutter, y, color)
        px(img, hx + flutter, hy - 10, GOLD_BRIGHT)
    elif face == "right":
        for i in range(7):
            y = hy - 5 - (1 if i in (2, 3, 4) else 0) - flutter
            px(img, hx - 2 + i, y, color if i % 2 == 0 else dark)
        px(img, hx + 4, hy - 6 - flutter, GOLD_BRIGHT)
    else:
        for i in range(7):
            y = hy - 5 - (1 if i in (2, 3, 4) else 0) - flutter
            px(img, hx + 2 - i, y, color if i % 2 == 0 else dark)
        px(img, hx - 4, hy - 6 - flutter, GOLD_BRIGHT)


def draw_peak_and_tail(img, hx, hy, face, flutter):
    """Trojan cap: a forward point, and a short dark horsehair tail."""
    if face in ("front", "back"):
        px(img, hx, hy - 6, BRONZE_LIGHT)
        px(img, hx, hy - 7, GOLD_BRIGHT)
        px(img, hx - 1, hy - 5, BRONZE)
        px(img, hx + 1, hy - 5, BRONZE_DARK)
    elif face == "right":
        px(img, hx + 4, hy - 3, BRONZE_LIGHT)
        px(img, hx + 5, hy - 4, GOLD_BRIGHT)
        px(img, hx + 3, hy - 2, BRONZE)
    else:
        px(img, hx - 4, hy - 3, BRONZE_LIGHT)
        px(img, hx - 5, hy - 4, GOLD_BRIGHT)
        px(img, hx - 3, hy - 2, BRONZE)

    if face == "front":
        px(img, hx - 4, hy - 4, SEA_DEEP)
        px(img, hx + 4, hy - 4, INK)
    elif face == "back":
        for i in range(5):
            px(img, hx + flutter, hy - 1 + i, SEA_DEEP if i % 2 == 0 else INK)
    elif face == "right":
        for i in range(5):
            px(img, hx - 3 - i, hy - 4 + (i % 2), SEA_DEEP if i % 2 == 0 else INK)
    else:
        for i in range(5):
            px(img, hx + 3 + i, hy - 4 + (i % 2), SEA_DEEP if i % 2 == 0 else INK)


def draw_helmet(img, hx, hy, face, spec, frame):
    flutter = 1 if frame % 2 else 0
    ellipse(img, hx, hy - 1, 6, 5, BRONZE)
    ellipse(img, hx - 2, hy - 3, 3, 2, BRONZE_LIGHT)
    if face == "front":
        rect(img, hx - 6, hy, 2, 4, BRONZE)
        rect(img, hx + 4, hy, 2, 4, BRONZE_DARK)
        px(img, hx - 6, hy, BRONZE_LIGHT)
        ellipse(img, hx, hy + 1, 4, 3, SKIN)
        _face(img, hx, hy, face)
        for x in range(hx - 3, hx + 4):
            px(img, x, hy - 1, BRONZE_DARK)
    elif face == "back":
        ellipse(img, hx, hy, 6, 5, BRONZE_DARK)
        ellipse(img, hx, hy - 1, 5, 4, BRONZE)
        ellipse(img, hx - 2, hy - 3, 2, 2, BRONZE_LIGHT)
    elif face == "left":
        ellipse(img, hx - 1, hy + 1, 3, 3, SKIN)
        _face(img, hx, hy, "left")
        px(img, hx - 5, hy, BRONZE)
        px(img, hx - 5, hy + 1, BRONZE_DARK)
        px(img, hx - 4, hy - 1, BRONZE_LIGHT)
    else:
        ellipse(img, hx + 1, hy + 1, 3, 3, SKIN)
        _face(img, hx, hy, "right")
        px(img, hx + 5, hy, BRONZE_DARK)
        px(img, hx + 5, hy + 1, BRONZE_EDGE)
        px(img, hx + 4, hy - 1, BRONZE)

    if spec["helmet"] == "dome":
        draw_tall_crest(img, hx, hy, face, flutter)
    else:
        draw_peak_and_tail(img, hx, hy, face, flutter)


def draw_hair_head(img, hx, hy, face, spec):
    hair = spec["hair"]
    dark = spec["hair_dark"]
    ellipse(img, hx, hy, 6, 6, dark)
    ellipse(img, hx, hy - 1, 6, 5, hair)
    if face == "back":
        if spec.get("wreath"):
            draw_wreath(img, hx, hy - 4, spec["wreath"], spec["wreath_light"])
        if spec.get("fillet"):
            draw_fillet(img, hx, hy - 3)
        return
    if face == "front":
        ellipse(img, hx, hy + 1, 5, 4, SKIN)
    elif face == "left":
        ellipse(img, hx - 1, hy + 1, 4, 4, SKIN)
    else:
        ellipse(img, hx + 1, hy + 1, 4, 4, SKIN)
    _face(img, hx, hy, face)
    if spec.get("beard"):
        draw_beard(img, hx, hy, face, spec["beard"], spec["beard_dark"])
    if spec.get("wreath"):
        draw_wreath(img, hx, hy - 5, spec["wreath"], spec["wreath_light"])
    if spec.get("fillet"):
        draw_fillet(img, hx, hy - 4)


def draw_shield(img, cx, cy, face, kind, spec):
    if face in ("left", "right"):
        rx, ry = 3, 5
    elif kind == "oval":
        rx, ry = 4, 6
    else:
        rx, ry = 5, 5
    ellipse(img, cx, cy, rx + 1, ry + 1, spec["shield_rim"])
    ellipse(img, cx, cy, rx, ry, spec["shield_face"])
    ellipse(img, cx - 1, cy - 1, max(rx - 2, 1), max(ry - 2, 1), spec.get("shield_light", BRONZE_LIGHT))
    if kind == "round" and face not in ("left", "right"):
        for x in range(cx - rx + 1, cx + rx):
            px(img, x, cy + 1, TERRACOTTA)
            px(img, x, cy + 2, TERRACOTTA_DARK)
    elif kind == "oval" and face not in ("left", "right"):
        px(img, cx, cy - 2, GOLD_BRIGHT)
        px(img, cx - 1, cy, GOLD)
        px(img, cx + 1, cy, GOLD)
        px(img, cx, cy + 2, GOLD)
    ellipse(img, cx, cy, 2, 2, GOLD)
    px(img, cx - 1, cy - 1, GOLD_BRIGHT)
    px(img, cx, cy, spec["shield_boss"])


def draw_spear(img, x0, y0, x1, y1):
    dx, dy = x1 - x0, y1 - y0
    mag = max(abs(dx), abs(dy), 1)
    bx = int(round(x1 - 3 * dx / mag))
    by = int(round(y1 - 3 * dy / mag))
    line(img, x0, y0, bx, by, HULL)
    line(img, bx, by, x1, y1, BRONZE_LIGHT)
    px(img, x1, y1, GOLD_BRIGHT)
    px(img, bx, by, BRONZE)


def draw_kylix(img, x, y, gem=False):
    ellipse(img, x, y, 3, 2, GOLD)
    ellipse(img, x, y, 2, 1, WINE)
    px(img, x - 1, y, GOLD_BRIGHT)
    px(img, x, y + 2, GOLD_DARK)
    px(img, x, y + 3, GOLD_DARK)
    px(img, x - 1, y + 3, GOLD)
    px(img, x + 1, y + 3, GOLD)
    if gem:
        px(img, x + 1, y - 1, TERRACOTTA_HOT)


def weapon_hand(cx, y0, face, step):
    # One pixel of sway. The hand stays outside the torso so the spear and cup
    # do not sink into the beard or the shield.
    sway = 0 if step == 0 else (1 if step > 0 else -1)
    if face == "front":
        return cx - 8 + sway, y0 + 2
    if face == "back":
        return cx + 8 - sway, y0 + 2
    if face == "right":
        return cx + 5, y0 + 2
    return cx - 5, y0 + 2


def spear_tip(hand_x, hand_y, face, step):
    if face == "front":
        return hand_x - 2, 3
    if face == "back":
        return hand_x + 2, 3
    # Chest height, clear of the crest, pointing the way they walk.
    if face == "right":
        return min(30, hand_x + 8), hand_y - 1
    return max(1, hand_x - 8), hand_y - 1


def shield_anchor(cx, y0, face, step):
    sway = -step
    if face == "front":
        return cx + 7 + sway, y0 + 4
    if face == "back":
        return cx - 7 - sway, y0 + 3
    if face == "right":
        return cx + 2, y0 + 4
    return cx - 2, y0 + 4


def draw_person(direction, frame, spec):
    img = Image.new("RGBA", (32, 32), CLEAR)
    facing = FACING[direction]
    bob = -1 if frame in (1, 3) else 0
    step = -1 if frame == 0 else (1 if frame == 2 else 0)
    # Passing frames lean opposite ways so the four-beat cycle is not two poses.
    lean = -1 if frame == 1 else (1 if frame == 3 else 0)
    cx = 16 + facing["body"] + lean
    hx = 16 + facing["head"] + lean
    hy = 11 + bob
    y0 = 16 + bob
    face = facing["face"]

    ellipse(img, cx, 29, 7, 2, SHADOW)

    wide = 5 if spec["armor"] else 6
    _robe(img, cx, y0, spec["tunic"], spec["tunic_dark"], spec["tunic_light"], wide)
    if spec["armor"]:
        rect(img, cx - 5, y0, 11, 6, BRONZE)
        for y in range(y0, y0 + 6):
            px(img, cx - 5, y, BRONZE_LIGHT)
            px(img, cx + 5, y, BRONZE_DARK)
        for y in range(y0 + 1, y0 + 5):
            px(img, cx, y, BRONZE_DARK)
        px(img, cx - 2, y0 + 2, BRONZE_LIGHT)
        for x in range(cx - 5, cx + 6):
            px(img, x, y0 + 6, GOLD_DARK)
        px(img, cx, y0 + 6, GOLD_BRIGHT)
        for x in range(cx - 4, cx + 5, 2):
            px(img, x, y0 + 7, spec["tunic_dark"])
            px(img, x, y0 + 8, spec["tunic_dark"])
    else:
        for x in range(cx - 5, cx + 6):
            px(img, x, y0 + 9, GOLD_DARK)
            px(img, x, y0 + 4, spec["sash"])
        px(img, cx, y0, GOLD_BRIGHT)
        px(img, cx - 1, y0, GOLD)
        px(img, cx + 1, y0, GOLD)

    draw_feet(img, cx, 26 + bob, frame, face, "greave" if spec["armor"] else "sandal")

    if spec.get("helmet"):
        draw_helmet(img, hx, hy, face, spec, frame)
    else:
        draw_hair_head(img, hx, hy, face, spec)

    if spec.get("shield"):
        sx, sy = shield_anchor(cx, y0, face, step)
        draw_shield(img, sx, sy, face, spec["shield"], spec)

    hand_x, hand_y = weapon_hand(cx, y0, face, step)
    if spec["armor"]:
        px(img, hand_x, hand_y, BRONZE_LIGHT)
        px(img, hand_x, hand_y + 1, BRONZE_DARK)
    else:
        px(img, hand_x, hand_y, SKIN)
        px(img, hand_x + (1 if face == "right" else -1), hand_y, SKIN_SHADOW)

    if spec.get("weapon") == "spear":
        tip_x, tip_y = spear_tip(hand_x, hand_y, face, step)
        draw_spear(img, hand_x, hand_y, tip_x, tip_y)
    elif spec.get("weapon") == "cup":
        draw_kylix(img, hand_x, hand_y - 1, gem=spec.get("gem", False))

    outline(img)
    return img


GREEK = dict(
    tunic=TERRACOTTA,
    tunic_dark=TERRACOTTA_DARK,
    tunic_light=TERRACOTTA_HOT,
    armor=True,
    helmet="dome",
    shield="round",
    shield_face=BRONZE_LIGHT,
    shield_light=GOLD_BRIGHT,
    shield_rim=TERRACOTTA_DARK,
    shield_boss=GOLD_BRIGHT,
    weapon="spear",
)

TROJAN = dict(
    tunic=SEA,
    tunic_dark=SEA_DEEP,
    tunic_light=SEA_MID,
    armor=True,
    helmet="pointed",
    shield="oval",
    shield_face=SEA_MID,
    shield_light=SEA_LIGHT,
    shield_rim=BRONZE_DARK,
    shield_boss=GOLD,
    weapon="spear",
)

ANTINOUS = dict(
    tunic=WINE,
    tunic_dark=WINE_DARK,
    tunic_light=TERRACOTTA,
    armor=False,
    sash=GOLD,
    helmet=None,
    weapon="cup",
    gem=True,
    hair=INK,
    hair_dark=(20, 14, 12, 255),
    beard=INK,
    beard_dark=(20, 14, 12, 255),
    fillet=True,
)

EURYMACHUS = dict(
    tunic=LAUREL,
    tunic_dark=LAUREL_DARK,
    tunic_light=LAUREL_LIGHT,
    armor=False,
    sash=GOLD_DARK,
    helmet=None,
    weapon="cup",
    hair=HAIR_BROWN,
    hair_dark=HAIR_BROWN_DARK,
    beard=HAIR_BROWN,
    beard_dark=HAIR_BROWN_DARK,
    wreath=LAUREL_LIGHT,
    wreath_light=LAUREL,
)

AMPHINOMUS = dict(
    tunic=PARCHMENT,
    tunic_dark=PARCHMENT_DEEP,
    tunic_light=WHITE,
    armor=False,
    sash=SEA_MID,
    helmet=None,
    weapon="cup",
    hair=HAIR_LIGHT,
    hair_dark=HAIR_BROWN,
    fillet=True,
)


def draw_hound(direction, frame):
    img = Image.new("RGBA", (32, 32), CLEAR)
    facing = FACING[direction]
    bob = -1 if frame in (1, 3) else 0
    step = -1 if frame == 0 else (1 if frame == 2 else 0)
    face = facing["face"]
    cx = 16 + facing["body"]
    hx = 16 + facing["head"]
    hy = 14 + bob
    wag = (1, -1, 1, 0)[frame]

    ellipse(img, cx, 29, 7, 2, SHADOW)

    def ear(x, y, flip=1):
        px(img, x, y, TAN_DARK)
        px(img, x, y + 1, TAN)
        px(img, x + flip, y + 2, TAN_DARK)
        px(img, x + flip, y + 3, TAN)

    def eye(x, y):
        px(img, x, y, WHITE)
        px(img, x, y + 1, INK)

    def paw(x, y, lift=0):
        yy = y + lift
        rect(img, x, yy - 3, 2, 3, TAN)
        px(img, x, yy - 3, TAN_LIGHT)
        px(img, x, yy, TAN_DARK)
        px(img, x + 1, yy, INK)

    if face in ("left", "right"):
        sign = 1 if face == "right" else -1
        body = hx - sign * 5
        ellipse(img, body, hy + 4, 8, 4, TAN_DARK)
        ellipse(img, body - sign, hy + 3, 7, 3, TAN)
        ellipse(img, body, hy + 2, 4, 2, TAN_LIGHT)
        ellipse(img, hx, hy, 4, 3, TAN)
        ellipse(img, hx + sign * 3, hy + 1, 2, 2, TAN_LIGHT)
        px(img, hx + sign * 4, hy + 1, INK)
        eye(hx + sign, hy - 1)
        ear(hx - sign, hy - 3, flip=-sign)
        # tail, behind the rump
        tail_x = body - sign * 8
        line(img, body - sign * 6, hy + 2, tail_x, hy + wag, TAN_DARK)
        px(img, tail_x, hy + wag, TAN)
        # collar
        px(img, hx - sign * 2, hy + 2, GOLD)
        px(img, hx - sign * 2, hy + 3, GOLD_BRIGHT)
        y = 26 + bob
        for i, ox in enumerate((-6, -3, 1, 4)):
            if frame == 0:
                lift = -1 if i % 2 == 0 else 0
            elif frame == 2:
                lift = -1 if i % 2 == 1 else 0
            elif frame == 1:
                lift = -1 if i < 2 else 0
            else:
                lift = -1 if i >= 2 else 0
            shift = step if i >= 2 else -step
            paw(body + ox + shift, y, lift)
    elif face == "front":
        ellipse(img, cx, hy + 5, 6, 5, TAN_DARK)
        ellipse(img, cx, hy + 4, 5, 4, TAN)
        ellipse(img, cx - 1, hy + 3, 3, 2, TAN_LIGHT)
        ellipse(img, hx, hy, 5, 4, TAN)
        ellipse(img, hx, hy + 2, 2, 2, TAN_LIGHT)
        px(img, hx, hy + 3, INK)
        eye(hx - 2, hy)
        eye(hx + 2, hy)
        ear(hx - 5, hy - 3, flip=-1)
        ear(hx + 5, hy - 3, flip=1)
        px(img, hx - 3, hy + 3, GOLD)
        px(img, hx - 2, hy + 3, GOLD_BRIGHT)
        px(img, hx + 2, hy + 3, GOLD_BRIGHT)
        px(img, hx + 3, hy + 3, GOLD)
        y = 26 + bob
        front = [cx - 4 + step, cx + 2 - step]
        back = [cx - 2, cx + 1]
        for i, x in enumerate(front):
            if frame == 1:
                lift = -1 if i == 0 else 0
            elif frame == 3:
                lift = -1 if i == 1 else 0
            else:
                lift = 0
            paw(x, y, lift)
        for x in back:
            paw(x, y - 2, 0)
    else:
        # Walking away. Tail comes toward the camera, hind paws on the ground.
        ellipse(img, cx, hy + 5, 6, 5, TAN_DARK)
        ellipse(img, cx, hy + 4, 5, 4, TAN)
        ellipse(img, hx, hy, 5, 4, TAN_DARK)
        ellipse(img, hx, hy - 1, 4, 3, TAN)
        ear(hx - 5, hy - 2, flip=-1)
        ear(hx + 4, hy - 2, flip=1)
        line(img, cx, hy + 6, cx + wag, hy + 11, TAN_DARK)
        px(img, cx + wag, hy + 11, TAN)
        px(img, cx + wag, hy + 12, TAN_LIGHT)
        px(img, hx - 2, hy + 3, GOLD)
        px(img, hx + 2, hy + 3, GOLD)
        y = 26 + bob
        for i, x in enumerate((cx - 4, cx - 1, cx + 1, cx + 3)):
            if frame == 0:
                lift = -1 if i % 2 == 0 else 0
            elif frame == 2:
                lift = -1 if i % 2 == 1 else 0
            elif frame == 1:
                lift = -1 if i < 2 else 0
            else:
                lift = -1 if i >= 2 else 0
            paw(x + (step if i < 2 else 0), y, lift)

    outline(img)
    return img


# --- props -----------------------------------------------------------------

def draw_throne():
    img = Image.new("RGBA", (48, 64), CLEAR)
    ellipse(img, 24, 60, 16, 3, SHADOW)
    # dais
    rect(img, 6, 52, 36, 6, PARCHMENT_DEEP)
    rect(img, 6, 52, 36, 1, WHITE)
    rect(img, 8, 57, 32, 2, LINE)
    # legs
    rect(img, 10, 44, 4, 10, HULL)
    rect(img, 34, 44, 4, 10, HULL)
    px(img, 10, 44, DECK_LIGHT)
    px(img, 34, 44, DECK_LIGHT)
    # seat
    rect(img, 12, 40, 24, 8, TERRACOTTA_DARK)
    rect(img, 13, 41, 22, 5, TERRACOTTA)
    rect(img, 14, 41, 10, 2, TERRACOTTA_HOT)
    # arms
    rect(img, 8, 36, 6, 10, DECK)
    rect(img, 34, 36, 6, 10, DECK_DARK)
    rect(img, 8, 36, 6, 2, GOLD)
    rect(img, 34, 36, 6, 2, GOLD_DARK)
    px(img, 9, 36, GOLD_BRIGHT)
    # posts and back
    rect(img, 12, 14, 4, 28, HULL)
    rect(img, 32, 14, 4, 28, DECK_DARK)
    rect(img, 16, 16, 16, 24, DECK)
    for y in range(18, 38, 4):
        for x in range(17, 31):
            px(img, x, y, DECK_DARK)
    rect(img, 18, 18, 12, 16, DECK_LIGHT)
    # sun device
    ellipse(img, 24, 26, 3, 3, GOLD)
    px(img, 24, 26, GOLD_BRIGHT)
    for dx, dy in ((0, -5), (0, 5), (-5, 0), (5, 0), (-3, -3), (3, -3), (-3, 3), (3, 3)):
        px(img, 24 + dx, 26 + dy, GOLD)
    # crest
    rect(img, 10, 10, 28, 6, HULL)
    rect(img, 10, 10, 28, 2, GOLD_DARK)
    ellipse(img, 24, 10, 4, 3, GOLD)
    px(img, 24, 8, GOLD_BRIGHT)
    for x in range(12, 36, 3):
        px(img, x, 12, GOLD_BRIGHT)
    outline(img)
    return img


def draw_banquet():
    img = Image.new("RGBA", (64, 48), CLEAR)
    ellipse(img, 32, 44, 22, 3, SHADOW)
    # legs
    for x, color in ((12, HULL), (48, DECK_DARK), (18, DECK_DARK), (44, HULL)):
        rect(img, x, 26, 3, 16, color)
        px(img, x, 26, DECK_LIGHT)
    # top, near edge darker
    ellipse(img, 32, 22, 26, 12, DECK_DARK)
    ellipse(img, 32, 20, 24, 10, DECK)
    ellipse(img, 30, 18, 16, 6, DECK_LIGHT)
    # platter
    ellipse(img, 32, 20, 7, 4, PARCHMENT_DEEP)
    ellipse(img, 32, 19, 5, 3, TERRACOTTA)
    ellipse(img, 31, 18, 2, 1, TERRACOTTA_HOT)
    # bread
    ellipse(img, 44, 18, 4, 2, PARCHMENT)
    px(img, 43, 18, LINE)
    px(img, 45, 17, PARCHMENT_DEEP)
    # grapes
    for dx, dy in ((-14, -2), (-12, -1), (-13, 1), (-11, 0), (-15, 0), (-12, -3)):
        px(img, 32 + dx, 20 + dy, LAUREL_DARK)
        px(img, 33 + dx, 20 + dy, LAUREL)
    # Bowls seen from above. A stemmed kylix read as a mushroom at this size.
    for bx, by in ((18, 16), (46, 22)):
        ellipse(img, bx, by, 3, 2, GOLD)
        ellipse(img, bx, by, 2, 1, WINE)
        px(img, bx - 1, by - 1, GOLD_BRIGHT)
    outline(img)
    return img


def draw_loom(frame):
    img = Image.new("RGBA", (32, 48), CLEAR)
    ellipse(img, 16, 45, 10, 2, SHADOW)
    # posts and beams
    rect(img, 6, 8, 3, 34, HULL)
    rect(img, 23, 8, 3, 34, DECK_DARK)
    rect(img, 6, 8, 20, 3, DECK)
    rect(img, 6, 8, 20, 1, DECK_LIGHT)
    rect(img, 6, 38, 20, 3, HULL)
    # warp
    for x in range(11, 22, 2):
        for y in range(11, 38):
            px(img, x, y, PARCHMENT_DEEP if (x + y) % 4 else LINE)
    # cloth, growing is static; the stripe is Penelope's web
    rect(img, 10, 28, 12, 10, PARCHMENT)
    for x in range(10, 22):
        px(img, x, 30, TERRACOTTA)
        px(img, x, 33, GOLD_DARK)
        px(img, x, 36, SEA)
    for y in range(28, 38):
        px(img, 10, y, WHITE)
        px(img, 21, y, PARCHMENT_DEEP)
    # shuttle
    sx = 12 if frame == 0 else 18
    ellipse(img, sx, 24, 4, 2, DECK_LIGHT)
    ellipse(img, sx, 24, 2, 1, GOLD)
    px(img, sx, 26, LINE)
    line(img, sx, 26, 16, 28, WHITE)
    outline(img)
    return img


def draw_bow_rack():
    img = Image.new("RGBA", (32, 48), CLEAR)
    ellipse(img, 16, 45, 10, 2, SHADOW)
    # stand
    rect(img, 6, 40, 20, 4, HULL)
    rect(img, 6, 40, 20, 1, DECK_LIGHT)
    rect(img, 14, 12, 3, 28, DECK_DARK)
    px(img, 14, 12, DECK_LIGHT)
    # quiver
    rect(img, 4, 22, 7, 16, TERRACOTTA_DARK)
    rect(img, 5, 23, 5, 14, DECK)
    for i, x in enumerate((6, 8, 10)):
        line(img, x, 22, x, 10 - (i % 2), DECK_LIGHT)
        px(img, x, 9 - (i % 2), BRONZE_LIGHT)
        px(img, x, 23, WHITE)
    # bow, belly to the right of the string
    y0, y1 = 10, 38
    for y in range(y0, y1 + 1):
        t = (y - y0) / (y1 - y0)
        bend = math.sin(t * math.pi)
        x = int(round(22 + 6 * bend))
        px(img, x, y, PARCHMENT)
        px(img, x + 1, y, PARCHMENT_DEEP)
        px(img, 22, y, INK)
    px(img, 22, y0, GOLD)
    px(img, 22, y1, GOLD_BRIGHT)
    px(img, 28, 24, GOLD)
    outline(img)
    return img


def draw_column():
    img = Image.new("RGBA", (32, 64), CLEAR)
    ellipse(img, 16, 61, 10, 2, SHADOW)
    # stepped base
    rect(img, 4, 54, 24, 6, PARCHMENT_DEEP)
    rect(img, 4, 54, 24, 1, WHITE)
    rect(img, 7, 50, 18, 5, LINE)
    rect(img, 7, 50, 18, 1, PARCHMENT)
    # shaft
    rect(img, 10, 16, 12, 35, PARCHMENT)
    for y in range(16, 51):
        px(img, 10, y, WHITE)
        px(img, 11, y, PARCHMENT)
        px(img, 13, y, PARCHMENT_DEEP)
        px(img, 16, y, LINE)
        px(img, 19, y, PARCHMENT_DEEP)
        px(img, 21, y, LINE)
    # capital
    rect(img, 6, 12, 20, 5, PARCHMENT)
    rect(img, 4, 8, 24, 5, WHITE)
    ellipse(img, 8, 13, 4, 3, PARCHMENT)
    ellipse(img, 24, 13, 4, 3, PARCHMENT)
    ellipse(img, 8, 13, 2, 1, LINE)
    ellipse(img, 24, 13, 2, 1, LINE)
    px(img, 7, 12, GOLD)
    px(img, 24, 12, GOLD)
    rect(img, 3, 5, 26, 4, PARCHMENT)
    for x in range(4, 28, 3):
        px(img, x, 6, GOLD)
    px(img, 4, 5, WHITE)
    outline(img)
    return img


def draw_brazier(frame):
    img = Image.new("RGBA", (32, 32), CLEAR)
    ellipse(img, 16, 29, 8, 2, SHADOW)
    # tripod
    line(img, 16, 20, 8, 27, BRONZE_DARK)
    line(img, 16, 20, 24, 27, BRONZE_DARK)
    line(img, 16, 20, 16, 27, HULL)
    px(img, 8, 27, BRONZE)
    px(img, 24, 27, BRONZE)
    # bowl
    ellipse(img, 16, 18, 8, 4, BRONZE_DARK)
    ellipse(img, 16, 17, 7, 3, BRONZE)
    ellipse(img, 15, 16, 4, 2, BRONZE_LIGHT)
    for dx, col in ((-3, FLAME_DEEP), (-1, TERRACOTTA), (1, GOLD), (3, FLAME_DEEP), (0, GOLD_BRIGHT)):
        px(img, 16 + dx, 17, col)
    flames = [
        [(0, -8, WHITE), (0, -7, GOLD_BRIGHT), (-1, -6, GOLD_BRIGHT), (0, -6, WHITE),
         (1, -5, FLAME), (0, -5, FLAME), (-1, -4, FLAME), (0, -3, FLAME_DEEP), (1, -3, TERRACOTTA)],
        [(1, -7, WHITE), (1, -6, GOLD_BRIGHT), (0, -5, FLAME), (2, -5, GOLD_BRIGHT),
         (1, -4, FLAME), (0, -3, FLAME_DEEP), (2, -3, TERRACOTTA), (-1, -4, FLAME)],
        [(0, -9, WHITE), (0, -8, GOLD_BRIGHT), (-1, -7, GOLD_BRIGHT), (1, -7, WHITE),
         (0, -6, FLAME), (-2, -5, FLAME), (0, -4, FLAME_DEEP), (1, -3, TERRACOTTA)],
        [(-1, -7, WHITE), (-1, -6, GOLD_BRIGHT), (-2, -5, FLAME), (0, -5, GOLD_BRIGHT),
         (-1, -4, FLAME), (1, -4, TERRACOTTA), (0, -3, FLAME_DEEP)],
    ]
    for dx, dy, col in flames[frame % 4]:
        px(img, 16 + dx, 16 + dy, col)
    outline(img)
    return img


def draw_door(frame):
    """frame 0 shut, frame 1 open. Outer stone frame stays put."""
    img = Image.new("RGBA", (48, 64), CLEAR)
    ellipse(img, 24, 61, 16, 2, SHADOW)
    # threshold and jambs and lintel, shared
    rect(img, 4, 54, 40, 6, PARCHMENT_DEEP)
    rect(img, 4, 54, 40, 1, WHITE)
    rect(img, 4, 8, 6, 46, LINE)
    rect(img, 38, 8, 6, 46, PARCHMENT_DEEP)
    for y in range(8, 54):
        px(img, 4, y, WHITE)
        px(img, 43, y, LINE)
    rect(img, 2, 4, 44, 8, PARCHMENT)
    rect(img, 2, 4, 44, 2, WHITE)
    for x in range(6, 42, 4):
        px(img, x, 7, GOLD)
        px(img, x + 1, 8, GOLD_DARK)
    if frame == 0:
        rect(img, 10, 12, 14, 42, DECK)
        rect(img, 24, 12, 14, 42, DECK_DARK)
        for y in range(14, 52, 6):
            for x in range(11, 23):
                px(img, x, y, HULL)
            for x in range(25, 37):
                px(img, x, y, HULL)
        for y in (20, 28, 36, 44):
            px(img, 14, y, GOLD)
            px(img, 18, y, GOLD_DARK)
            px(img, 28, y, GOLD)
            px(img, 32, y, GOLD_DARK)
        ellipse(img, 22, 32, 2, 2, GOLD)
        ellipse(img, 26, 32, 2, 2, GOLD)
        px(img, 22, 32, GOLD_BRIGHT)
        px(img, 26, 32, GOLD_BRIGHT)
        rect(img, 23, 12, 2, 42, INK)
    else:
        rect(img, 10, 12, 28, 42, SEA_DEEP)
        rect(img, 14, 16, 20, 28, (8, 18, 28, 255))
        # warm lamp inside
        ellipse(img, 24, 30, 3, 4, GOLD_DARK)
        px(img, 24, 28, GOLD_BRIGHT)
        px(img, 24, 29, FLAME)
        px(img, 23, 31, GOLD)
        # folded leaves
        rect(img, 10, 12, 4, 42, DECK_LIGHT)
        rect(img, 34, 12, 4, 42, DECK_DARK)
        for y in range(16, 50, 8):
            px(img, 11, y, GOLD)
            px(img, 36, y, GOLD_DARK)
        px(img, 13, 32, GOLD_BRIGHT)
        px(img, 34, 32, GOLD)
    outline(img)
    return img


def draw_hearth(frame):
    img = Image.new("RGBA", (48, 32), CLEAR)
    ellipse(img, 24, 28, 16, 3, SHADOW)
    ellipse(img, 24, 20, 16, 8, LINE)
    ellipse(img, 24, 20, 13, 6, PARCHMENT_DEEP)
    ellipse(img, 24, 20, 10, 5, (48, 32, 24, 255))
    for dx, dy, col in ((-4, 1, FLAME_DEEP), (-2, 0, TERRACOTTA), (2, 1, GOLD_DARK),
                        (4, 0, FLAME_DEEP), (0, 2, INK), (-1, -1, TERRACOTTA_HOT)):
        px(img, 24 + dx, 20 + dy, col)
    flames = [
        [(0, -10, WHITE), (0, -9, GOLD_BRIGHT), (-1, -8, GOLD_BRIGHT), (1, -7, FLAME),
         (0, -6, FLAME), (-2, -5, TERRACOTTA), (2, -4, FLAME_DEEP), (0, -4, FLAME)],
        [(1, -9, WHITE), (2, -8, GOLD_BRIGHT), (1, -7, FLAME), (0, -6, FLAME),
         (2, -5, TERRACOTTA), (-1, -4, FLAME_DEEP)],
        [(0, -11, WHITE), (-1, -10, GOLD_BRIGHT), (1, -9, WHITE), (0, -7, FLAME),
         (-2, -6, GOLD), (2, -5, TERRACOTTA), (0, -4, FLAME_DEEP)],
        [(-1, -9, WHITE), (-2, -8, GOLD_BRIGHT), (-1, -6, FLAME), (0, -5, TERRACOTTA),
         (1, -7, FLAME), (0, -4, FLAME_DEEP)],
    ]
    for dx, dy, col in flames[frame % 4]:
        px(img, 24 + dx, 18 + dy, col)
    # a firedog
    line(img, 12, 22, 20, 18, BRONZE_DARK)
    line(img, 28, 18, 36, 22, BRONZE_DARK)
    outline(img)
    return img


def draw_amphora():
    img = Image.new("RGBA", (32, 32), CLEAR)
    ellipse(img, 16, 29, 6, 2, SHADOW)
    # foot and body
    rect(img, 13, 24, 6, 3, TERRACOTTA_DARK)
    ellipse(img, 16, 18, 7, 8, TERRACOTTA_DARK)
    ellipse(img, 16, 17, 6, 7, TERRACOTTA)
    ellipse(img, 14, 15, 3, 4, TERRACOTTA_HOT)
    # neck and lip
    rect(img, 13, 8, 6, 6, TERRACOTTA)
    rect(img, 14, 8, 2, 6, TERRACOTTA_HOT)
    ellipse(img, 16, 8, 4, 2, TERRACOTTA_DARK)
    ellipse(img, 16, 7, 3, 1, PARCHMENT_DEEP)
    # handles, wide enough to read as an amphora rather than a jar
    line(img, 12, 11, 7, 13, TERRACOTTA_DARK)
    line(img, 7, 13, 7, 18, TERRACOTTA)
    line(img, 7, 18, 12, 20, TERRACOTTA_DARK)
    line(img, 19, 11, 24, 13, TERRACOTTA_DARK)
    line(img, 24, 13, 24, 18, HULL)
    line(img, 24, 18, 19, 20, TERRACOTTA_DARK)
    # black band
    for x in range(11, 22):
        px(img, x, 18, INK)
        px(img, x, 19, INK)
    for x in range(12, 21, 2):
        px(img, x, 18, GOLD_DARK)
    outline(img)
    return img


def character_sheet(draw_fn):
    sheet = Image.new("RGBA", (32 * 4, 32 * 8), CLEAR)
    for r, direction in enumerate(DIRS):
        for c in range(4):
            frame = draw_fn(direction, c)
            sheet.paste(frame, (c * 32, r * 32), frame)
    return sheet


def row_sheet(draw_fn, count, fw, fh):
    sheet = Image.new("RGBA", (fw * count, fh), CLEAR)
    for c in range(count):
        frame = draw_fn(c)
        sheet.paste(frame, (c * fw, 0), frame)
    return sheet


def checker_of(img, cell=8):
    board = Image.new("RGBA", img.size, (48, 56, 64, 255))
    pix = board.load()
    for y in range(img.height):
        for x in range(img.width):
            if (x // cell + y // cell) % 2 == 0:
                pix[x, y] = (28, 34, 40, 255)
    board.paste(img, (0, 0), img)
    return board


def pixel_text(text, scale=2, fill=GOLD_BRIGHT):
    tmp = Image.new("RGBA", (max(8, len(text) * 7 + 4), 14), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((1, 1), text, fill=fill)
    box = tmp.getbbox()
    if not box:
        return tmp
    tmp = tmp.crop(box)
    return tmp.resize((tmp.width * scale, tmp.height * scale), Image.NEAREST)


def framed(img, scale, frame_w, frame_h):
    board = checker_of(img)
    big = board.resize((img.width * scale, img.height * scale), Image.NEAREST)
    draw = ImageDraw.Draw(big)
    line_col = (196, 163, 106, 255)
    for x in range(0, big.width, frame_w * scale):
        draw.line([(x, 0), (x, big.height - 1)], fill=line_col)
    for y in range(0, big.height, frame_h * scale):
        draw.line([(0, y), (big.width - 1, y)], fill=line_col)
    draw.rectangle([0, 0, big.width - 1, big.height - 1], outline=line_col)
    return big


def labeled_block(title, img, scale, frame_w, frame_h, row_labels=None):
    sprite = framed(img, scale, frame_w, frame_h)
    title_im = pixel_text(title, 2)
    label_w = 0
    labels = []
    if row_labels:
        labels = [pixel_text(name, 2) for name in row_labels]
        label_w = max(im.width for im in labels) + 8
    block = Image.new(
        "RGBA",
        (label_w + sprite.width + 4, title_im.height + 6 + sprite.height),
        (24, 28, 32, 255),
    )
    block.paste(title_im, (0, 0), title_im)
    top = title_im.height + 6
    if row_labels:
        row_h = frame_h * scale
        for i, lab in enumerate(labels):
            block.paste(lab, (0, top + i * row_h + row_h // 2 - lab.height // 2), lab)
    block.paste(sprite, (label_w, top))
    return block


def build_preview(blocks, page_w=1280):
    gap = 16
    # measure
    x, y = gap, gap
    row_h = 0
    positions = []
    for block in blocks:
        if x > gap and x + block.width + gap > page_w:
            x = gap
            y += row_h + gap
            row_h = 0
        positions.append((x, y))
        x += block.width + gap
        row_h = max(row_h, block.height)
    height = y + row_h + gap
    width = page_w
    canvas = Image.new("RGBA", (width, height), (24, 28, 32, 255))
    banner = pixel_text(
        "L1 Troy + L2 Ithaca    4 walk x 8 dir (S SW W NW N NE E SE)    origin bottom-center",
        2,
    )
    # rebuild with banner room
    canvas = Image.new("RGBA", (width, height + banner.height + 8), (24, 28, 32, 255))
    canvas.paste(banner, (gap, 6), banner)
    shift = banner.height + 8
    for block, (bx, by) in zip(blocks, positions):
        canvas.paste(block, (bx, by + shift))
    return canvas


def assert_frame(frame, name, detail):
    alpha = frame.getchannel("A")
    if alpha.getextrema()[1] <= 200:
        raise SystemExit(f"{name} {detail} is empty")


def assert_character(sheet, name):
    if sheet.size != (128, 256):
        raise SystemExit(f"{name} sheet is {sheet.size}, expected 128x256")
    for r, direction in enumerate(DIRS):
        for c in range(4):
            frame = sheet.crop((c * 32, r * 32, c * 32 + 32, r * 32 + 32))
            assert_frame(frame, name, f"{direction} f{c}")
            # Ground contact on the planted frames, same band as the siren.
            if c in (0, 2):
                hit = False
                pix = frame.load()
                for y in range(24, 28):
                    for x in range(6, 26):
                        if pix[x, y][3] > 200:
                            hit = True
                if not hit:
                    raise SystemExit(f"{name} {direction} f{c} misses the ground line")


def update_manifest(path, npc_entries, prop_entries):
    data = json.loads(path.read_text()) if path.exists() else {
        "frameWidth": 32,
        "frameHeight": 32,
        "framesPerDirection": 4,
        "directions": DIRS,
        "directionAxis": "rows top to bottom",
        "frameAxis": "columns left to right, walk cycle",
        "origin": "bottom-center",
        "npcs": {},
        "props": {},
    }
    data.setdefault("npcs", {}).update(npc_entries)
    data.setdefault("props", {}).update(prop_entries)
    path.write_text(json.dumps(data, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root
    assets = root / "public" / "assets"
    npc_root = assets / "sprites" / "npcs"
    prop_root = assets / "props"
    preview_path = root / "art" / "previews" / "level1_level2_preview.png"
    prop_root.mkdir(parents=True, exist_ok=True)
    preview_path.parent.mkdir(parents=True, exist_ok=True)

    people = {
        "greek_hoplite": lambda d, f: draw_person(d, f, GREEK),
        "trojan_soldier": lambda d, f: draw_person(d, f, TROJAN),
        "suitor_antinous": lambda d, f: draw_person(d, f, ANTINOUS),
        "suitor_eurymachus": lambda d, f: draw_person(d, f, EURYMACHUS),
        "suitor_amphinomus": lambda d, f: draw_person(d, f, AMPHINOMUS),
        "suitors_hound": draw_hound,
    }
    sheets = {}
    npc_manifest = {}
    for name, draw_fn in people.items():
        sheet = character_sheet(draw_fn)
        assert_character(sheet, name)
        out = npc_root / name
        out.mkdir(parents=True, exist_ok=True)
        dest = out / f"{name}_32.png"
        sheet.save(dest)
        sheets[name] = sheet
        npc_manifest[name] = f"sprites/npcs/{name}/{name}_32.png"
        print(f"wrote {dest.relative_to(root)} {sheet.size}")

    singles = {
        "palace_throne": (draw_throne(), 48, 64, 1),
        "palace_banquet": (draw_banquet(), 64, 48, 1),
        "palace_bow_rack": (draw_bow_rack(), 32, 48, 1),
        "palace_column": (draw_column(), 32, 64, 1),
        "palace_amphora": (draw_amphora(), 32, 32, 1),
    }
    rows = {
        "palace_loom": (lambda i: draw_loom(i), 2, 32, 48),
        "palace_brazier": (lambda i: draw_brazier(i), 4, 32, 32),
        "palace_door": (lambda i: draw_door(i), 2, 48, 64),
        "palace_hearth": (lambda i: draw_hearth(i), 4, 48, 32),
    }
    prop_images = {}
    prop_manifest = {}
    for name, (image, fw, fh, frames) in singles.items():
        assert image.size == (fw, fh)
        assert_frame(image, name, "single")
        dest = prop_root / f"{name}.png"
        image.save(dest)
        prop_images[name] = (image, fw, fh)
        prop_manifest[name] = {
            "image": f"props/{name}.png",
            "frameWidth": fw,
            "frameHeight": fh,
            "frames": frames,
        }
        print(f"wrote {dest.relative_to(root)} {image.size}")
    for name, (draw_fn, count, fw, fh) in rows.items():
        image = row_sheet(draw_fn, count, fw, fh)
        if image.size != (fw * count, fh):
            raise SystemExit(f"{name} sheet is {image.size}")
        for c in range(count):
            assert_frame(image.crop((c * fw, 0, (c + 1) * fw, fh)), name, f"f{c}")
        dest = prop_root / f"{name}.png"
        image.save(dest)
        prop_images[name] = (image, fw, fh)
        prop_manifest[name] = {
            "image": f"props/{name}.png",
            "frameWidth": fw,
            "frameHeight": fh,
            "frames": count,
        }
        print(f"wrote {dest.relative_to(root)} {image.size}")

    update_manifest(assets / "sprites" / "sheet.json", npc_manifest, prop_manifest)
    print("updated public/assets/sprites/sheet.json")

    scale = 3
    blocks = []
    for name in people:
        blocks.append(labeled_block(
            f"{name}  128x256  4x8",
            sheets[name],
            scale,
            32,
            32,
            DIRS,
        ))
    captions = {
        "palace_throne": "palace_throne  48x64  1 frame",
        "palace_banquet": "palace_banquet  64x48  1 frame",
        "palace_loom": "palace_loom  32x48  2 frames (shuttle)",
        "palace_bow_rack": "palace_bow_rack  32x48  1 frame",
        "palace_column": "palace_column  32x64  1 frame",
        "palace_brazier": "palace_brazier  32x32  4 frames",
        "palace_door": "palace_door  48x64  2 frames (shut, open)",
        "palace_hearth": "palace_hearth  48x32  4 frames",
        "palace_amphora": "palace_amphora  32x32  1 frame",
    }
    for name, caption in captions.items():
        image, fw, fh = prop_images[name]
        blocks.append(labeled_block(caption, image, scale, fw, fh))
    preview = build_preview(blocks)
    preview.save(preview_path)
    print(f"wrote {preview_path.relative_to(root)} {preview.size}")


if __name__ == "__main__":
    main()
