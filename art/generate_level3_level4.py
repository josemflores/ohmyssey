#!/usr/bin/env python3
"""Generate Ohmyssey Level 3 (Sirens) and Level 4 (Aeolus) pixel art.

Spec from the team Message Board (issue #2):
  Tiled maps 40x30, tile size 16, layers Ground / Decor / Collision / Objects
  (spawn plus NPC points). Characters 32x32, 8 directions, high top-down.
  Palette taken from src/index.css.

Collision layers are saved hidden. Any gid > 0 on Collision blocks movement.
Character sheets are 4 walk frames by 8 directions:
  S, SW, W, NW, N, NE, E, SE. Origin is bottom-center.

Requires Pillow. Does not touch shared app files.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

W, H = 40, 30
TILE = 16
COLS = 16
ROWS = 8

# Palette from src/index.css, plus a few shades for 16px readability.
INK = (36, 28, 20, 255)
PARCHMENT = (246, 234, 210, 255)
PARCHMENT_DEEP = (214, 184, 138, 255)
LINE = (196, 163, 106, 255)
SEA_DEEP = (14, 44, 60, 255)
SEA = (22, 72, 94, 255)
SEA_MID = (31, 109, 134, 255)
SEA_LIGHT = (64, 168, 186, 255)
FOAM = (215, 243, 238, 255)
FOAM_DIM = (140, 206, 204, 255)
GOLD = (196, 150, 60, 255)
GOLD_BRIGHT = (240, 212, 138, 255)
GOLD_DARK = (132, 88, 32, 255)
TERRACOTTA = (156, 59, 46, 255)
TERRACOTTA_DARK = (104, 34, 26, 255)
LAUREL = (47, 107, 69, 255)
LAUREL_LIGHT = (96, 168, 108, 255)
LAUREL_DARK = (24, 68, 40, 255)
BRONZE = (176, 116, 52, 255)
BRONZE_DARK = (104, 66, 30, 255)
BRONZE_LIGHT = (220, 168, 92, 255)
BRONZE_EDGE = (64, 40, 20, 255)
SKY = (126, 186, 214, 255)
SKY_DEEP = (70, 138, 180, 255)
SKY_PALE = (186, 220, 234, 255)
CLOUD = (250, 253, 255, 255)
CLOUD_SHADE = (186, 210, 224, 255)
ROCK = (132, 140, 148, 255)
ROCK_DARK = (62, 68, 78, 255)
ROCK_MID = (96, 104, 114, 255)
ROCK_LIGHT = (186, 192, 198, 255)
ROCK_WET = (74, 98, 112, 255)
SAND = (214, 186, 132, 255)
DECK = (156, 104, 58, 255)
DECK_DARK = (96, 60, 32, 255)
DECK_LIGHT = (196, 142, 86, 255)
HULL = (92, 58, 36, 255)
SKIN = (232, 184, 140, 255)
SKIN_SHADOW = (190, 132, 96, 255)
HAIR = (32, 148, 140, 255)
HAIR_DARK = (16, 82, 80, 255)
HAIR_LIGHT = (120, 214, 198, 255)
NAVY = (28, 52, 92, 255)
NAVY_LIGHT = (58, 92, 140, 255)
WHITE = (255, 250, 242, 255)
BEARD = (244, 240, 232, 255)
CLEAR = (0, 0, 0, 0)
BLOCK = (160, 32, 36, 150)

DIRS = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"]


def new_tile(color=CLEAR):
    img = Image.new("RGBA", (TILE, TILE), color)
    return img


def px(img, x, y, color):
    if 0 <= x < img.width and 0 <= y < img.height and color[3]:
        img.putpixel((int(x), int(y)), color)


def rect(img, x, y, w, h, color):
    for yy in range(int(y), int(y + h)):
        for xx in range(int(x), int(x + w)):
            px(img, xx, yy, color)


def fill(img, color):
    rect(img, 0, 0, img.width, img.height, color)


def ellipse(img, cx, cy, rx, ry, color):
    if rx <= 0 or ry <= 0:
        return
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                px(img, x, y, color)


def stamp(rows, cmap):
    img = new_tile()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            color = cmap.get(ch)
            if color:
                px(img, x, y, color)
    return img


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


def shade_edge(img, light, dark):
    """Top-left highlight and bottom-right shade on an opaque tile."""
    px_data = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            if x < 2 or y < 2:
                if (x + y) % 3 == 0:
                    px(img, x, y, light)
            if x > w - 3 or y > h - 3:
                if (x + y) % 2 == 0:
                    px(img, x, y, dark)
    return img


# --- tiles -----------------------------------------------------------------

def tile_water(base, ripple, variant):
    img = new_tile(base)
    rows = (3, 8, 13) if variant == 0 else (5, 11)
    shift = 2 if variant else 0
    for i, y in enumerate(rows):
        x0 = (2 + shift + i * 5) % 12
        for dx in range(3):
            px(img, x0 + dx, y, ripple)
        if variant == 0:
            px(img, (x0 + 8) % 16, y + 1, ripple)
    px(img, 14, 2 + variant, FOAM_DIM if base != SEA_DEEP else SEA)
    return img


def tile_wave():
    img = new_tile(SEA_MID)
    for x in range(16):
        y = 6 + int(round(math.sin(x * 0.7) * 1.2))
        px(img, x, y, FOAM)
        px(img, x, y + 1, FOAM_DIM)
        px(img, x, y + 5, SEA_LIGHT)
    return img


def tile_shallow(variant=0):
    # A shoal, still the same sea. A brighter base was reading as cyan squares.
    img = new_tile(SEA)
    sand = ((2, 13), (3, 13), (11, 14), (7, 15)) if variant == 0 else ((5, 14), (12, 12), (8, 15))
    for x, y in sand:
        px(img, x, y, SAND)
    ripple = ((4, 4), (5, 4), (10, 8)) if variant == 0 else ((2, 6), (3, 6), (12, 9))
    for x, y in ripple:
        px(img, x, y, SEA_MID)
    return img


def tile_rock(variant):
    """Speckles stay off the tile edge so repeats do not form stripes."""
    img = new_tile(ROCK)
    specks = {
        0: [(3, 3), (4, 3), (11, 5), (6, 8), (7, 8), (10, 11), (4, 12)],
        1: [(5, 4), (9, 3), (8, 7), (9, 7), (4, 10), (12, 11), (6, 12)],
        2: [(4, 5), (8, 4), (11, 8), (12, 8), (6, 11), (3, 9), (9, 12)],
    }[variant % 3]
    for x, y in specks:
        px(img, x, y, ROCK_DARK if (x + y) % 2 else ROCK_WET)
    for x, y in ((2, 2), (3, 2), (2, 3)):
        px(img, x, y, ROCK_LIGHT)
    if variant == 2:
        px(img, 8, 8, ROCK_LIGHT)
        px(img, 9, 9, ROCK_MID)
    return img


def tile_wet():
    img = tile_rock(2)
    for x in range(16):
        px(img, x, 0, ROCK_WET)
        px(img, x, 15, ROCK_DARK)
    return img


def tile_cliff(side):
    """High top-down cliff. The lit top is the surface; the dark band is the face."""
    img = tile_rock(0)
    if side == "S":
        for x in range(16):
            lip = 8 + (x * 3 + 1) % 4
            for y in range(lip, 16):
                px(img, x, y, ROCK_DARK if y > lip + 1 else ROCK_MID)
            px(img, x, lip - 1, ROCK_LIGHT)
            if x % 4 == 1:
                px(img, x, 14, (40, 44, 52, 255))
    elif side == "N":
        rect(img, 0, 0, 16, 4, ROCK_DARK)
        for x in range(16):
            px(img, x, 4, ROCK_LIGHT)
    elif side == "W":
        rect(img, 0, 0, 4, 16, ROCK_DARK)
        for y in range(16):
            px(img, 4, y, ROCK_LIGHT)
            if y % 3 == 0:
                px(img, 1, y, ROCK_MID)
    elif side == "E":
        rect(img, 12, 0, 4, 16, ROCK_DARK)
        for y in range(16):
            px(img, 11, y, ROCK_LIGHT)
            if y % 3 == 0:
                px(img, 14, y, ROCK_MID)
    elif side == "SW":
        rect(img, 0, 10, 16, 6, ROCK_DARK)
        rect(img, 0, 0, 5, 16, ROCK_DARK)
        for i in range(6):
            px(img, i, 9 + i, ROCK_MID)
    elif side == "SE":
        rect(img, 0, 10, 16, 6, ROCK_DARK)
        rect(img, 11, 0, 5, 16, ROCK_DARK)
    elif side == "NW":
        rect(img, 0, 0, 16, 4, ROCK_DARK)
        rect(img, 0, 0, 4, 16, ROCK_DARK)
    elif side == "NE":
        rect(img, 0, 0, 16, 4, ROCK_DARK)
        rect(img, 12, 0, 4, 16, ROCK_DARK)
    return img


def tile_peak(variant):
    # Same sea as the open water, so a stack does not read as a bright square.
    water = SEA
    img = new_tile(water)
    # Jagged stack. Bottom of the tile is rock so it sits on a cliff below.
    cols = [
        "......xxxx......",
        ".....xxxxxx.....",
        "....xxxxxxxx....",
        "...xxxxxxxxxx...",
        "..xxxxxxxxxxxx..",
        "..xxx..xxxxxxx..",
        "...xxxxxxxxxx...",
        "....xxxxxxxxx...",
        "....xxxxxxxx....",
        "...xxxxxxxxxx...",
        "..xxxxxxxxxxxx..",
        ".xxxxxxxxxxxxxx.",
        "xxxxxxxxxxxxxxxx",
        "xxx..xxxx..xxxxx",
        "ffffffffffffffff",
        "wwwwwwwwwwwwwwww",
    ]
    if variant == 1:
        cols = [
            "...xx...........",
            "..xxxx..........",
            ".xxxxxx.........",
            "xxxxxxxx........",
            ".xxxxxxx..xx....",
            "..xxxxxxxxxxxxx.",
            "...xxxxxxxxxxxx.",
            "....xxxxxxxxxxx.",
            ".....xxxxxxxxxx.",
            "....xxxxxxxxxxxx",
            "...xxxxxxxxxxxxx",
            "..xxxxxxxxxxxxxx",
            "xxxxxxxxxxxxxxxx",
            "xx.xxxx.xxxx.xxx",
            "ffffffffffffffff",
            "wwwwwwwwwwwwwwww",
        ]
    cmap = {
        "x": ROCK,
        ".": None,
        "f": FOAM,
        "w": SEA_LIGHT,
    }
    # repaint water first then stamp rock
    fill(img, water)
    for y, row in enumerate(cols):
        for x, ch in enumerate(row):
            if ch == "x":
                color = ROCK_LIGHT if y < 3 or x < 3 else ROCK
                if (x + y + variant) % 7 == 0:
                    color = ROCK_DARK
                px(img, x, y, color)
            elif ch == "f":
                px(img, x, y, FOAM if (x + variant) % 2 == 0 else FOAM_DIM)
            elif ch == "w":
                px(img, x, y, SEA)
    return img


def tile_deck(variant):
    img = new_tile(DECK)
    for y in range(16):
        band = (y // 4) % 2
        color = DECK_LIGHT if band == variant % 2 else DECK
        for x in range(16):
            px(img, x, y, color)
        if y % 4 == 0:
            for x in range(16):
                px(img, x, y, DECK_DARK)
        # nails
        px(img, 2, y // 4 * 4 + 2, GOLD_DARK)
        px(img, 13, y // 4 * 4 + 2, GOLD_DARK)
    if variant == 1:
        px(img, 8, 6, DECK_DARK)
        px(img, 9, 6, DECK_DARK)
        px(img, 8, 7, DECK_DARK)
    return img


def tile_hull(edge=False):
    img = new_tile(HULL)
    for y in range(16):
        for x in range(16):
            if (x + y) % 8 == 0:
                px(img, x, y, DECK_DARK)
    for y in range(16):
        px(img, 0, y, BRONZE_EDGE)
        px(img, 15, y, BRONZE_EDGE)
    if edge:
        rect(img, 0, 11, 16, 5, (62, 38, 24, 255))
        for x in range(0, 16, 4):
            px(img, x + 1, 13, GOLD_DARK)
    else:
        for x in range(3, 13, 4):
            px(img, x, 8, GOLD_DARK)
    return img


def tile_bow():
    img = tile_water(SEA, SEA_LIGHT, 0)
    # pointed bow, top-down, wood in the lower two-thirds tapering up
    for y in range(4, 16):
        inset = max(0, (10 - y))
        for x in range(inset, 16 - inset):
            px(img, x, y, DECK_LIGHT if y % 4 else DECK)
        px(img, inset, y, BRONZE_EDGE)
        px(img, 15 - inset, y, BRONZE_EDGE)
    px(img, 8, 3, GOLD)
    px(img, 7, 4, GOLD_BRIGHT)
    px(img, 8, 4, GOLD_BRIGHT)
    return img


def tile_stern():
    img = tile_hull(True)
    rect(img, 2, 2, 12, 6, DECK)
    for x in range(2, 14):
        px(img, x, 2, DECK_DARK)
    # steering oar hint
    px(img, 14, 4, DECK_LIGHT)
    px(img, 15, 5, DECK_LIGHT)
    px(img, 15, 6, GOLD_DARK)
    return img


def tile_bronze_floor(inlay=False, variant=0):
    # Stone court, distinct from the orange bronze walls.
    base = (142, 132, 114, 255) if variant == 0 else (128, 118, 102, 255)
    img = new_tile(base)
    stone_dark = (96, 88, 76, 255)
    stone_light = (176, 166, 146, 255)
    for x in range(16):
        px(img, x, 0, stone_dark)
        px(img, x, 15, BRONZE_EDGE)
        px(img, 0, x, stone_dark)
        px(img, 15, x, BRONZE_EDGE)
    for x in range(3, 13):
        px(img, x, 3, stone_light)
        px(img, x, 12, stone_dark)
    if inlay:
        # square spiral, a tiny meander
        for x in range(5, 11):
            px(img, x, 5, GOLD)
            px(img, x, 10, GOLD)
        for y in range(5, 11):
            px(img, 5, y, GOLD)
            px(img, 10, y, GOLD)
        for x in range(7, 9):
            px(img, x, 7, GOLD_BRIGHT)
            px(img, x, 8, GOLD_BRIGHT)
    else:
        px(img, 8, 8, BRONZE_LIGHT if variant == 0 else BRONZE_DARK)
    return img


def tile_wall():
    img = new_tile(BRONZE_EDGE)
    rect(img, 1, 1, 14, 14, BRONZE)
    rect(img, 2, 2, 12, 4, BRONZE_LIGHT)
    rect(img, 2, 11, 12, 3, BRONZE_DARK)
    for x in range(3, 13):
        px(img, x, 6, GOLD_DARK)
        if x % 2 == 0:
            px(img, x, 3, GOLD_BRIGHT)
    for x in range(4, 12, 3):
        px(img, x, 12, BRONZE_EDGE)
    return img


def tile_tower():
    img = tile_wall()
    rect(img, 4, 3, 8, 3, GOLD)
    rect(img, 6, 1, 4, 2, GOLD_BRIGHT)
    px(img, 7, 0, GOLD_BRIGHT)
    px(img, 8, 0, PARCHMENT)
    # crenels
    for x in (3, 7, 11):
        px(img, x, 2, BRONZE_EDGE)
    return img


def tile_gate():
    img = tile_bronze_floor(False, 0)
    rect(img, 0, 0, 3, 16, BRONZE)
    rect(img, 13, 0, 3, 16, BRONZE)
    for y in range(16):
        px(img, 0, y, BRONZE_EDGE)
        px(img, 2, y, GOLD_DARK)
        px(img, 13, y, GOLD_DARK)
        px(img, 15, y, BRONZE_EDGE)
    rect(img, 1, 1, 1, 3, GOLD_BRIGHT)
    rect(img, 14, 1, 1, 3, GOLD_BRIGHT)
    return img


def tile_sky(variant):
    img = new_tile(SKY_DEEP if variant == 2 else SKY)
    if variant == 1:
        for x, y in ((2, 3), (3, 3), (11, 9), (4, 12)):
            px(img, x, y, SKY_PALE)
    elif variant == 0:
        px(img, 13, 5, SKY_PALE)
        px(img, 5, 11, SKY_DEEP)
    return img


def tile_cloud_dock(variant):
    if variant == 1:
        # Interior of a cloud you can stand on. One tone, so tiles join.
        img = new_tile(CLOUD)
        for x, y in ((2, 3), (11, 5), (6, 12), (13, 10)):
            px(img, x, y, CLOUD_SHADE)
        px(img, 4, 4, WHITE)
        return img
    img = new_tile(SKY)
    ellipse(img, 8, 9, 8, 6, CLOUD)
    ellipse(img, 5, 8, 4, 3, WHITE)
    ellipse(img, 11, 11, 4, 3, CLOUD_SHADE)
    return img


def decor_foam():
    img = new_tile()
    for x in range(16):
        y = 8 + int(round(math.sin(x * 0.8) * 1.4))
        px(img, x, y, FOAM)
        if x % 2 == 0:
            px(img, x, y - 1, FOAM)
        px(img, x, y + 1, FOAM_DIM)
    return img


def decor_crash():
    img = new_tile()
    for x in range(16):
        crest = 5 + (1 if 3 < x < 12 else 0)
        px(img, x, crest, FOAM)
        px(img, x, crest + 1, WHITE)
        px(img, x, crest + 2, FOAM_DIM)
        if x % 3 == 0:
            px(img, x, crest - 2, FOAM)
            px(img, x + (1 if x < 15 else 0), crest - 3, WHITE)
    # spray
    for x, y in ((2, 1), (8, 0), (13, 2), (5, 2)):
        px(img, x, y, FOAM)
    return img


def decor_cloud(big=True):
    img = new_tile()
    if big:
        ellipse(img, 8, 9, 7, 4, CLOUD_SHADE)
        ellipse(img, 6, 8, 4, 3, CLOUD)
        ellipse(img, 11, 8, 4, 3, CLOUD)
        ellipse(img, 8, 6, 3, 2, WHITE)
    else:
        ellipse(img, 8, 9, 5, 3, CLOUD)
        ellipse(img, 6, 8, 3, 2, WHITE)
        ellipse(img, 10, 10, 3, 2, CLOUD_SHADE)
    return img


def decor_lantern():
    img = new_tile()
    rect(img, 7, 4, 2, 10, DECK_DARK)
    rect(img, 5, 3, 6, 2, BRONZE_DARK)
    rect(img, 6, 5, 4, 5, GOLD)
    rect(img, 7, 6, 2, 3, GOLD_BRIGHT)
    px(img, 7, 7, WHITE)
    px(img, 8, 7, WHITE)
    # glow
    for x, y in ((4, 7), (11, 7), (5, 5), (10, 9), (7, 11), (3, 8)):
        px(img, x, y, GOLD_BRIGHT)
    return img


def decor_column():
    img = new_tile()
    rect(img, 4, 2, 8, 12, PARCHMENT_DEEP)
    rect(img, 3, 1, 10, 2, PARCHMENT)
    rect(img, 3, 13, 10, 2, PARCHMENT_DEEP)
    for y in range(3, 13):
        px(img, 5, y, PARCHMENT)
        px(img, 10, y, LINE)
    px(img, 4, 2, LINE)
    return img


def decor_perch():
    img = new_tile()
    ellipse(img, 8, 9, 6, 4, ROCK_LIGHT)
    ellipse(img, 8, 8, 4, 2, ROCK)
    for x, y in ((4, 10), (11, 11), (8, 12)):
        px(img, x, y, ROCK_DARK)
    return img


def decor_wind(variant):
    img = new_tile()
    path = [(2, 8), (3, 7), (4, 7), (5, 8), (6, 9), (8, 8), (9, 7), (11, 6), (12, 6), (13, 7)]
    if variant:
        path = [(x, y + 2) for x, y in path]
    for x, y in path:
        px(img, x, y, CLOUD)
        px(img, x, y + 1, SKY_PALE)
    px(img, 14, 6 if not variant else 8, WHITE)
    return img


def decor_olive():
    img = new_tile()
    rect(img, 7, 9, 2, 6, DECK_DARK)
    ellipse(img, 8, 7, 5, 4, LAUREL)
    ellipse(img, 6, 6, 3, 2, LAUREL_LIGHT)
    ellipse(img, 10, 8, 2, 2, LAUREL_DARK)
    return img


def decor_sail():
    img = new_tile()
    rect(img, 7, 1, 2, 14, DECK_DARK)
    for y in range(3, 13):
        half = 2 + (y - 3) // 2
        for x in range(8, min(16, 8 + half)):
            px(img, x, y, SAIL_COLOR if y % 4 else PARCHMENT)
    return img


SAIL_COLOR = (236, 228, 210, 255)


def decor_oar():
    img = new_tile()
    for i in range(10):
        px(img, 3 + i, 4 + i // 2, DECK_LIGHT)
    ellipse(img, 13, 10, 3, 2, DECK)
    px(img, 14, 10, DECK_LIGHT)
    return img


def decor_rope():
    img = new_tile()
    ellipse(img, 8, 8, 4, 3, LINE)
    ellipse(img, 8, 8, 2, 1, DECK)
    px(img, 12, 7, LINE)
    px(img, 13, 6, LINE)
    return img


def decor_reeds():
    img = new_tile()
    for x, h in ((4, 10), (7, 13), (10, 9), (12, 12)):
        for y in range(16 - h, 15):
            px(img, x, y, LAUREL_DARK if y % 2 else LAUREL)
        px(img, x, 16 - h, LAUREL_LIGHT)
    return img


def tile_block():
    img = new_tile(BLOCK)
    for i in range(16):
        px(img, i, i, (255, 220, 220, 220))
        px(img, i, 15 - i, (255, 220, 220, 220))
    return img


def build_tileset():
    """Return (image, name->gid). Gid is Tiled's 1-based id."""
    sheet = Image.new("RGBA", (COLS * TILE, ROWS * TILE), CLEAR)
    names = {}

    def put(name, col, row, img):
        assert img.size == (TILE, TILE), name
        sheet.paste(img, (col * TILE, row * TILE))
        names[name] = row * COLS + col + 1

    put("deep", 0, 0, tile_water(SEA_DEEP, SEA, 0))
    put("sea", 1, 0, tile_water(SEA, SEA_MID, 0))
    put("sea_b", 2, 0, tile_water(SEA, SEA_LIGHT, 1))
    put("shallow", 3, 0, tile_shallow(0))
    put("shallow_b", 4, 0, tile_shallow(1))
    put("wave", 5, 0, tile_wave())
    put("sea_dark", 6, 0, tile_water(SEA_DEEP, SEA_MID, 1))
    put("shore", 7, 0, tile_shallow(0))

    put("rock", 0, 1, tile_rock(0))
    put("rock_b", 1, 1, tile_rock(1))
    put("rock_crack", 2, 1, tile_rock(2))
    put("rock_wet", 3, 1, tile_wet())
    put("cliff_s", 4, 1, tile_cliff("S"))
    put("cliff_n", 5, 1, tile_cliff("N"))
    put("cliff_w", 6, 1, tile_cliff("W"))
    put("cliff_e", 7, 1, tile_cliff("E"))
    put("cliff_sw", 8, 1, tile_cliff("SW"))
    put("cliff_se", 9, 1, tile_cliff("SE"))
    put("cliff_nw", 10, 1, tile_cliff("NW"))
    put("cliff_ne", 11, 1, tile_cliff("NE"))
    put("peak", 12, 1, tile_peak(0))
    put("peak_b", 13, 1, tile_peak(1))
    put("rock_light", 14, 1, tile_rock(0))
    # brighten rock_light a bit
    light = tile_rock(0)
    rect(light, 3, 3, 10, 8, ROCK_LIGHT)
    for x, y in ((4, 5), (9, 8), (6, 7)):
        px(light, x, y, ROCK)
    put("perch_ground", 15, 1, light)

    put("deck", 0, 2, tile_deck(0))
    put("deck_b", 1, 2, tile_deck(1))
    put("hull", 2, 2, tile_hull(False))
    put("hull_s", 3, 2, tile_hull(True))
    put("bow", 4, 2, tile_bow())
    put("stern", 5, 2, tile_stern())

    put("floor", 0, 3, tile_bronze_floor(False, 0))
    put("floor_b", 1, 3, tile_bronze_floor(False, 1))
    put("inlay", 2, 3, tile_bronze_floor(True, 0))
    put("wall", 3, 3, tile_wall())
    put("tower", 4, 3, tile_tower())
    put("gate", 5, 3, tile_gate())
    put("sky", 6, 3, tile_sky(0))
    put("sky_b", 7, 3, tile_sky(1))
    put("sky_deep", 8, 3, tile_sky(2))
    put("dock", 9, 3, tile_cloud_dock(0))
    put("dock_b", 10, 3, tile_cloud_dock(1))

    put("foam", 0, 4, decor_foam())
    put("crash", 1, 4, decor_crash())
    put("cloud", 2, 4, decor_cloud(True))
    put("cloud_sm", 3, 4, decor_cloud(False))
    put("lantern", 4, 4, decor_lantern())
    put("column", 5, 4, decor_column())
    put("perch", 6, 4, decor_perch())
    put("wind", 7, 4, decor_wind(0))
    put("wind_b", 8, 4, decor_wind(1))
    put("olive", 9, 4, decor_olive())
    put("sail", 10, 4, decor_sail())
    put("oar", 11, 4, decor_oar())
    put("rope", 12, 4, decor_rope())
    put("reeds", 13, 4, decor_reeds())

    # Bag of winds as four decor tiles, sliced from the still prop.
    bag = draw_bag(0)
    put("bag_tl", 0, 5, bag.crop((0, 0, 16, 16)))
    put("bag_tr", 1, 5, bag.crop((16, 0, 32, 16)))
    put("bag_bl", 2, 5, bag.crop((0, 16, 16, 32)))
    put("bag_br", 3, 5, bag.crop((16, 16, 32, 32)))

    put("block", 15, 7, tile_block())
    return sheet, names


# --- characters ------------------------------------------------------------

FACING = {
    "S": dict(head=0, body=0, face="front", hair=0, lantern=9, wing=1),
    "SW": dict(head=-3, body=-1, face="front", hair=-2, lantern=-9, wing=1),
    "W": dict(head=-5, body=-2, face="left", hair=-5, lantern=-10, wing=1),
    "NW": dict(head=-3, body=-1, face="back", hair=-3, lantern=-8, wing=0),
    "N": dict(head=0, body=0, face="back", hair=0, lantern=8, wing=0),
    "NE": dict(head=3, body=1, face="back", hair=3, lantern=9, wing=0),
    "E": dict(head=5, body=2, face="right", hair=5, lantern=10, wing=1),
    "SE": dict(head=3, body=1, face="front", hair=2, lantern=9, wing=1),
}


def _robe(img, ox, y0, color, dark, light, wide=6):
    for i, y in enumerate(range(y0, y0 + 10)):
        half = wide - i // 4
        for x in range(ox - half, ox + half + 1):
            px(img, x, y, color)
        px(img, ox - half, y, light)
        px(img, ox + half, y, dark)
    # hem shade
    for x in range(ox - 4, ox + 5):
        px(img, x, y0 + 9, dark)


def _face(img, hx, hy, mode, skin=SKIN):
    if mode == "back":
        return
    eye_y = hy + 1
    if mode == "front":
        px(img, hx - 2, eye_y, INK)
        px(img, hx + 2, eye_y, INK)
        px(img, hx, eye_y + 2, TERRACOTTA)
        px(img, hx - 3, eye_y + 1, SKIN_SHADOW)
        px(img, hx + 3, eye_y + 1, SKIN_SHADOW)
    elif mode == "left":
        px(img, hx - 2, eye_y, INK)
        px(img, hx - 4, eye_y + 1, SKIN_SHADOW)
        px(img, hx - 1, eye_y + 2, TERRACOTTA)
    elif mode == "right":
        px(img, hx + 2, eye_y, INK)
        px(img, hx + 4, eye_y + 1, SKIN_SHADOW)
        px(img, hx + 1, eye_y + 2, TERRACOTTA)


def _lantern(img, x, y):
    for dx, dy in ((0, -2), (-2, 0), (2, 0), (0, 2), (-1, -1), (1, -1), (-3, 0), (3, 0)):
        px(img, x + dx, y + dy, GOLD_BRIGHT)
    rect(img, x - 1, y - 1, 3, 4, GOLD)
    px(img, x, y, WHITE)
    px(img, x, y + 1, GOLD_DARK)
    px(img, x, y - 2, BRONZE_DARK)


def draw_siren(direction, frame):
    img = Image.new("RGBA", (32, 32), CLEAR)
    f = FACING[direction]
    bob = -1 if frame % 2 else 0
    step = (frame - 1) if frame in (0, 2) else 0
    if frame == 2:
        step = 1
    elif frame == 0:
        step = -1
    else:
        step = 0
    cx = 16 + f["body"]
    hy = 11 + bob
    hx = 16 + f["head"]
    # shadow
    ellipse(img, cx, 29, 6, 2, (10, 16, 24, 90))
    # back hair
    ellipse(img, hx - f["hair"] // 3, hy + 1, 7, 6, HAIR_DARK)
    ellipse(img, hx, hy - 1, 6, 5, HAIR)
    # wings, large enough to read at map scale
    if f["wing"]:
        wing_y = 16 + bob
        if f["face"] != "left":
            for i in range(6):
                px(img, cx + 7 + i, wing_y + i // 2, WHITE)
                px(img, cx + 7 + i, wing_y + 1 + i // 2, FOAM)
        if f["face"] != "right":
            for i in range(6):
                px(img, cx - 7 - i, wing_y + i // 2, WHITE)
                px(img, cx - 7 - i, wing_y + 1 + i // 2, FOAM)
    _robe(img, cx, 16 + bob, FOAM, (150, 186, 184, 255), WHITE, 6)
    # sash
    for x in range(cx - 4, cx + 5):
        px(img, x, 20 + bob, HAIR)
    # feet
    px(img, cx - 3 + step, 26 + bob, SKIN)
    px(img, cx - 2 + step, 26 + bob, SKIN)
    px(img, cx + 2 - step, 26 + bob, SKIN_SHADOW)
    px(img, cx + 3 - step, 26 + bob, SKIN_SHADOW)
    # head
    ellipse(img, hx, hy, 5, 5, SKIN)
    ellipse(img, hx, hy - 2, 5, 3, HAIR)
    # side locks
    lock = 1 if frame % 2 == 0 else 0
    for i in range(8):
        px(img, hx - 5 - lock, hy + i, HAIR if i % 2 == 0 else HAIR_DARK)
        px(img, hx + 5 + lock, hy + i, HAIR_LIGHT if i % 3 == 0 else HAIR)
    _face(img, hx, hy, f["face"])
    # gold band
    px(img, hx - 1, hy + 3, GOLD)
    px(img, hx, hy + 3, GOLD_BRIGHT)
    px(img, hx + 1, hy + 3, GOLD)
    outline(img)
    return img


def draw_crew(direction, frame):
    img = Image.new("RGBA", (32, 32), CLEAR)
    f = FACING[direction]
    bob = -1 if frame % 2 else 0
    step = -1 if frame == 0 else (1 if frame == 2 else 0)
    cx = 16 + f["body"]
    hx = 16 + f["head"]
    hy = 11 + bob
    ellipse(img, cx, 29, 6, 2, (10, 16, 24, 90))
    _robe(img, cx, 16 + bob, NAVY, (16, 28, 58, 255), NAVY_LIGHT, 5)
    for x in range(cx - 4, cx + 5):
        px(img, x, 21 + bob, TERRACOTTA)
    # boots
    px(img, cx - 3 + step, 26 + bob, DECK_DARK)
    px(img, cx - 2 + step, 26 + bob, DECK_DARK)
    px(img, cx + 2 - step, 26 + bob, INK)
    px(img, cx + 3 - step, 26 + bob, INK)
    ellipse(img, hx, hy, 5, 5, SKIN)
    # cap
    ellipse(img, hx, hy - 3, 5, 3, NAVY)
    rect(img, hx - 5, hy - 2, 10, 2, NAVY_LIGHT)
    _face(img, hx, hy, f["face"])
    if f["face"] == "front":
        px(img, hx, hy + 3, DECK_DARK)  # short beard
    _lantern(img, cx + f["lantern"], 18 + bob)
    outline(img)
    return img


def draw_aeolus(direction, frame):
    img = Image.new("RGBA", (32, 32), CLEAR)
    f = FACING[direction]
    bob = -1 if frame % 2 else 0
    step = -1 if frame == 0 else (1 if frame == 2 else 0)
    cx = 16 + f["body"]
    hx = 16 + f["head"]
    hy = 11 + bob
    ellipse(img, cx, 29, 7, 2, (20, 24, 32, 90))
    # cloak a little wider than the robe
    _robe(img, cx, 15 + bob, WHITE, PARCHMENT_DEEP, CLOUD, 7)
    for x in range(cx - 5, cx + 6):
        px(img, x, 15 + bob, GOLD)
        px(img, x, 24 + bob, GOLD_DARK)
    # sandals
    px(img, cx - 3 + step, 26 + bob, GOLD_DARK)
    px(img, cx + 2 - step, 26 + bob, GOLD_DARK)
    ellipse(img, hx, hy, 5, 5, SKIN)
    # circlet
    for dx in range(-4, 5):
        px(img, hx + dx, hy - 4, GOLD)
    px(img, hx, hy - 5, GOLD_BRIGHT)
    # Full white beard so he reads as the wind god, not a clean-shaven sailor.
    if f["face"] == "back":
        ellipse(img, hx, hy + 3, 6, 5, BEARD)
        ellipse(img, hx, hy + 6, 4, 4, WHITE)
    else:
        ellipse(img, hx, hy + 4, 5, 4, BEARD)
        ellipse(img, hx, hy + 7, 3, 4, WHITE)
        for i in range(5):
            px(img, hx - 1, hy + 6 + i, BEARD)
            px(img, hx, hy + 6 + i, WHITE)
            px(img, hx + 1, hy + 6 + i, BEARD)
    _face(img, hx, hy, f["face"], SKIN)
    # wind wisp in the off hand
    wx = cx - f["lantern"]
    wy = 18 + bob + (frame % 2)
    for i, (dx, dy) in enumerate(((0, 0), (1, -1), (2, 0), (3, 1), (4, 0))):
        px(img, wx + dx, wy + dy, CLOUD if i % 2 == 0 else SKY_PALE)
    outline(img)
    return img


def draw_bag(frame):
    img = Image.new("RGBA", (32, 32), CLEAR)
    squash = frame % 2
    ellipse(img, 16, 30, 8, 2, (20, 24, 32, 80))
    ellipse(img, 16, 18 + squash, 9, 8 - squash, PARCHMENT_DEEP)
    ellipse(img, 15, 16, 7, 6, PARCHMENT)
    ellipse(img, 13, 15, 3, 2, WHITE)
    # neck
    rect(img, 13, 8, 6, 5, PARCHMENT_DEEP)
    rect(img, 14, 6, 4, 3, LINE)
    # tie
    px(img, 12, 9, GOLD_DARK)
    px(img, 11, 8, GOLD)
    px(img, 19, 9, GOLD_DARK)
    px(img, 20, 8, GOLD)
    px(img, 16, 7, GOLD_BRIGHT)
    # bronze clasp
    rect(img, 14, 18, 4, 3, BRONZE)
    px(img, 15, 19, GOLD_BRIGHT)
    # wind escaping, shifts with the frame
    shift = frame % 2
    puffs = [(23, 12), (24, 13), (25, 11), (26, 14), (27, 12), (28, 15), (22, 15), (29, 13)]
    for i, (x, y) in enumerate(puffs):
        px(img, x + shift, y - shift, WHITE if i % 3 == 0 else CLOUD)
    # seam
    for y in range(14, 24):
        px(img, 16, y, LINE)
    outline(img)
    return img


def character_sheet(draw_fn):
    sheet = Image.new("RGBA", (TILE * 8, 32 * 8), CLEAR)  # 4 frames * 32 = 128, but TILE*8 = 128. yes
    # 4 columns * 32 = 128, 8 rows * 32 = 256
    sheet = Image.new("RGBA", (32 * 4, 32 * 8), CLEAR)
    for r, direction in enumerate(DIRS):
        for c in range(4):
            frame = draw_fn(direction, c)
            sheet.paste(frame, (c * 32, r * 32), frame)
    return sheet


def bag_sheet():
    sheet = Image.new("RGBA", (32 * 4, 32), CLEAR)
    for c in range(4):
        frame = draw_bag(c)
        sheet.paste(frame, (c * 32, 0), frame)
    return sheet


# --- maps ------------------------------------------------------------------

WALK_L3 = {
    "deck",
    "deck_b",
    "bow",
    "stern",
    "rock",
    "rock_b",
    "rock_crack",
    "rock_light",
    "perch_ground",
}
WALK_L4 = {"floor", "floor_b", "inlay", "gate", "dock", "dock_b"}


def blank():
    return [[0 for _ in range(W)] for _ in range(H)]


def in_ellipse(x, y, cx, cy, rx, ry, wobble=0.0, freq=5.0):
    ang = math.atan2(y - cy, x - cx)
    wr = 1 + wobble * math.sin(ang * freq) + (wobble * 0.6) * math.sin(ang * 3 + 1.2)
    return ((x - cx) / (rx * wr)) ** 2 + ((y - cy) / (ry * wr)) ** 2 <= 1


def autotile_rock(rocks, x, y):
    n = (x, y - 1) in rocks
    s = (x, y + 1) in rocks
    w = (x - 1, y) in rocks
    e = (x + 1, y) in rocks
    opens = sum(1 for v in (n, s, w, e) if not v)
    if opens >= 3:
        return "peak" if (x + y) % 2 == 0 else "peak_b"
    if not s and not w:
        return "cliff_sw"
    if not s and not e:
        return "cliff_se"
    if not n and not w:
        return "cliff_nw"
    if not n and not e:
        return "cliff_ne"
    if not s:
        return "cliff_s"
    if not n:
        return "cliff_n"
    if not w:
        return "cliff_w"
    if not e:
        return "cliff_e"
    kind = (x * 7 + y * 3) % 7
    if kind == 0:
        return "rock_crack"
    if kind == 1:
        return "rock_b"
    return "rock"


def build_level3(names):
    ground = blank()
    decor = blank()
    collision = blank()
    rocks = set()
    # One solid stack. The rim becomes cliffs; the inside stays flat rock.
    for y in range(H):
        for x in range(W):
            if in_ellipse(x, y, 26, 14, 7.6, 5.8):
                rocks.add((x, y))
    # Notches and spurs on the rim only, so the top stays one walkable court.
    for p in ((20, 9), (33, 12), (32, 17), (23, 19), (30, 9)):
        rocks.discard(p)
    for p in ((18, 12), (18, 16), (34, 14), (34, 15), (26, 8), (27, 8), (25, 20), (26, 20)):
        rocks.add(p)
    # causeway, three tiles tall so the middle is interior rock
    for x in range(10, 20):
        for y in (13, 14, 15):
            rocks.add((x, y))

    ship = set()
    for y in range(12, 19):
        for x in range(3, 10):
            # taper the bow
            if y == 11:
                continue
            ship.add((x, y))
    # one-tile prow, so the bow is a single point instead of a picket fence
    ship.add((6, 11))

    flat = set()
    # walkable spine of the causeway, and the step onto the ship / island
    for x in range(9, 22):
        flat.add((x, 14))

    def g(name):
        return names[name]

    for y in range(H):
        for x in range(W):
            edge = x < 2 or y < 2 or x >= W - 2 or y >= H - 2
            if edge:
                ground[y][x] = g("deep")
            elif (x * 5 + y * 3) % 11 == 0:
                ground[y][x] = g("sea_b")
            elif (x * 13 + y * 7) % 37 == 0:
                ground[y][x] = g("wave")
            else:
                ground[y][x] = g("sea")

    for x, y in rocks:
        if (x, y) in flat:
            ground[y][x] = g("rock")
        else:
            ground[y][x] = g(autotile_rock(rocks, x, y))

    # isolated stacks and a jagged halo around the main rock
    halo = [
        (22, 7), (26, 6), (30, 7), (33, 9), (34, 13), (33, 17),
        (29, 20), (24, 21), (20, 19), (19, 15),         (18, 11), (21, 8),
        (28, 5), (16, 17),
    ]
    stacks = [(12, 7), (37, 9), (15, 23), (36, 22), (8, 24), (38, 16)]
    for i, (x, y) in enumerate(halo + stacks):
        if (x, y) in ship:
            continue
        ground[y][x] = g("peak" if i % 2 == 0 else "peak_b")
        rocks.add((x, y))

    for x, y in ship:
        # Starboard and port rails stay hull. The rest of the hull is deck you can walk.
        # A gap in the starboard rail at (9, 14) is the gangway onto the causeway.
        rail = x in (3, 9) and not (x == 9 and y == 14)
        if y == 11:
            ground[y][x] = g("bow")
        elif rail and y >= 17:
            ground[y][x] = g("hull_s")
        elif rail:
            ground[y][x] = g("hull")
        elif y == 18:
            ground[y][x] = g("stern")
        else:
            ground[y][x] = g("deck" if (x + y) % 2 == 0 else "deck_b")
    ground[14][9] = g("deck")

    # shallows around rock and ship
    for y in range(H):
        for x in range(W):
            if (x, y) in rocks or (x, y) in ship:
                continue
            near = any(
                (x + dx, y + dy) in rocks or (x + dx, y + dy) in ship
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            if near and ground[y][x] in (g("sea"), g("sea_b"), g("wave")):
                ground[y][x] = g("shallow" if (x + y) % 2 == 0 else "shallow_b")

    # decor: waves against rock, perches, ship dressing
    for y in range(H):
        for x in range(W):
            if (x, y) in rocks or (x, y) in ship:
                south_water = (x, y + 1) not in rocks and (x, y + 1) not in ship and y + 1 < H
                if (x, y) in rocks and south_water and (x, y) not in flat:
                    # crash sits on the water cell south of the rock
                    if ground[y + 1][x] not in (g("bow"),):
                        decor[y + 1][x] = g("crash")
                continue
            # foam on other water touching rock
            touching = any((x + dx, y + dy) in rocks for dx, dy in ((0, -1), (1, 0), (-1, 0)))
            if touching and decor[y][x] == 0:
                decor[y][x] = g("foam")

    # siren perches on chosen interior tiles; filled in after NPC pick
    # ship decor
    decor[13][6] = g("sail")
    decor[12][4] = g("lantern")
    decor[16][8] = g("lantern")
    decor[15][4] = g("oar")
    decor[14][8] = g("rope")
    decor[14][5] = g("rope")
    if decor[20][14] == 0:
        decor[20][18] = g("reeds")
    decor[21][24] = g("reeds")
    decor[8][30] = g("reeds")

    # collision
    for y in range(H):
        for x in range(W):
            tile_name = inv_name(names, ground[y][x])
            if tile_name not in WALK_L3:
                collision[y][x] = g("block")

    # NPCs on walkable tiles
    interior = []
    for x, y in rocks:
        if (x, y) in flat and x < 20:
            continue
        if inv_name(names, ground[y][x]) in WALK_L3 and x >= 20:
            # prefer cells whose neighbors are also walkable so they aren't on a lip
            if all(
                inv_name(names, ground[y + dy][x + dx]) in WALK_L3
                for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0))
                if 0 <= x + dx < W and 0 <= y + dy < H
            ):
                interior.append((x, y))
    interior.sort()
    if len(interior) < 3:
        raise SystemExit(f"level 3 interior too small: {len(interior)}")

    def pick_near(tx, ty, used):
        choices = [p for p in interior if p not in used]
        choices.sort(key=lambda p: (p[0] - tx) ** 2 + (p[1] - ty) ** 2)
        return choices[0]

    used = set()
    siren_spots = []
    for target in ((24, 10), (31, 14), (25, 18)):
        spot = pick_near(*target, used)
        used.add(spot)
        siren_spots.append(spot)
        decor[spot[1]][spot[0]] = g("perch")

    objects = [
        obj_point("spawn", "spawn", 6, 15, facing="E"),
        obj_point("crew_bow", "npc", 5, 14, sprite="crew_lantern", facing="E"),
        obj_point("crew_stern", "npc", 7, 16, sprite="crew_lantern", facing="E"),
    ]
    for i, (x, y) in enumerate(siren_spots):
        objects.append(obj_point(f"siren_{i+1}", "npc", x, y, sprite="siren", facing="W"))

    validate_reach("level3", ground, names, WALK_L3, objects)
    return ground, decor, collision, objects


def build_level4(names):
    ground = blank()
    decor = blank()
    collision = blank()

    def g(name):
        return names[name]

    for y in range(H):
        for x in range(W):
            if x < 2 or y < 2 or x >= W - 2 or y >= H - 2:
                ground[y][x] = g("sky_deep")
            elif (x * 2 + y) % 9 == 0:
                ground[y][x] = g("sky_b")
            else:
                ground[y][x] = g("sky")

    floor = set()
    walls = set()
    for y in range(8, 23):
        for x in range(10, 31):
            corner = (x in (10, 30) and y in (8, 22))
            if corner:
                continue
            edge = x in (10, 30) or y in (8, 22)
            gate = y == 22 and x in (18, 19, 20)
            if gate:
                floor.add((x, y))
                ground[y][x] = g("gate")
            elif edge:
                walls.add((x, y))
                if (x, y) in ((11, 9), (29, 9), (11, 21), (29, 21)):
                    ground[y][x] = g("tower")
                else:
                    ground[y][x] = g("wall")
            else:
                floor.add((x, y))
                ground[y][x] = g("floor" if (x + y) % 2 == 0 else "floor_b")

    # inlay diamond under the court
    for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
        ground[15 + dy][20 + dx] = g("inlay")

    # cloud dock outside the gate
    dock = set()
    for y in range(23, 27):
        for x in range(16, 23):
            if in_ellipse(x, y, 19, 24.2, 3.4, 2.1):
                dock.add((x, y))
    for x, y in dock:
        # Edge tiles stay puffy. Interior tiles are a continuous cloud top.
        edge = any((x + dx, y + dy) not in dock for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        ground[y][x] = g("dock" if edge else "dock_b")

    # clouds in the sky, kept off the island
    cloud_cells = [
        (3, 4, "cloud"),
        (4, 5, "cloud_sm"),
        (6, 3, "cloud_sm"),
        (34, 4, "cloud"),
        (36, 6, "cloud_sm"),
        (33, 7, "cloud_sm"),
        (4, 20, "cloud"),
        (6, 18, "cloud_sm"),
        (35, 24, "cloud"),
        (33, 26, "cloud_sm"),
        (14, 3, "cloud_sm"),
        (24, 4, "cloud"),
        (8, 27, "cloud_sm"),
        (27, 27, "cloud_sm"),
    ]
    for x, y, name in cloud_cells:
        if (x, y) not in floor and (x, y) not in walls and (x, y) not in dock:
            decor[y][x] = g(name)

    # courtyard dressing
    for x, y in ((13, 11), (27, 11), (13, 18), (27, 18)):
        decor[y][x] = g("column")
    for x, y in ((14, 16), (26, 14), (22, 12), (16, 12)):
        decor[y][x] = g("olive")
    for x, y in ((17, 13), (23, 16), (21, 17), (15, 14)):
        decor[y][x] = g("wind" if (x + y) % 2 == 0 else "wind_b")

    # bag, 2x2, on the inlay
    decor[14][18] = g("bag_tl")
    decor[14][19] = g("bag_tr")
    decor[15][18] = g("bag_bl")
    decor[15][19] = g("bag_br")

    for y in range(H):
        for x in range(W):
            tile_name = inv_name(names, ground[y][x])
            blocked = tile_name not in WALK_L4
            # columns stand on floor but block
            if inv_name(names, decor[y][x]) == "column":
                blocked = True
            if blocked:
                collision[y][x] = g("block")

    objects = [
        obj_point("spawn", "spawn", 19, 24, facing="N"),
        obj_point("aeolus", "npc", 23, 14, sprite="aeolus", facing="S"),
        obj_point(
            "bag_of_winds",
            "prop",
            19,
            15,
            sprite="bag_of_winds",
            facing="S",
            extra={"baked": True, "note": "Still pose is the 2x2 decor tiles bag_tl/tr/bl/br. Spawn the sprite only if those four decor cells are cleared."},
        ),
    ]
    validate_reach("level4", ground, names, WALK_L4, [o for o in objects if o["name"] != "bag_of_winds"])
    # bag sits on floor; columns must not be the aeolus tile
    return ground, decor, collision, objects


def inv_name(names, gid):
    if not hasattr(inv_name, "rev"):
        inv_name.rev = {}
    # rebuild once per names identity
    key = id(names)
    if getattr(inv_name, "key", None) != key:
        inv_name.rev = {v: k for k, v in names.items()}
        inv_name.key = key
    return inv_name.rev.get(gid, "")


def obj_point(name, kind, tx, ty, facing="S", sprite=None, extra=None):
    # Feet at the bottom-center of the tile. Sprite origin is bottom-center.
    obj = {
        "name": name,
        "type": kind,
        "class": kind,
        "x": tx * TILE + TILE / 2,
        "y": (ty + 1) * TILE,
        "width": 0,
        "height": 0,
        "point": True,
        "rotation": 0,
        "visible": True,
        "properties": [
            {"name": "facing", "type": "string", "value": facing},
            {"name": "tileX", "type": "int", "value": tx},
            {"name": "tileY", "type": "int", "value": ty},
        ],
    }
    if sprite:
        obj["properties"].append({"name": "sprite", "type": "string", "value": sprite})
    if extra:
        for k, v in extra.items():
            ptype = "bool" if isinstance(v, bool) else "string"
            obj["properties"].append({"name": k, "type": ptype, "value": v})
    return obj


def validate_reach(label, ground, names, walk, objects):
    walk_gids = {names[n] for n in walk}

    def walkable(x, y):
        return 0 <= x < W and 0 <= y < H and ground[y][x] in walk_gids

    spawn = next(o for o in objects if o["name"] == "spawn")
    sx, sy = int(spawn["properties"][1]["value"]), int(spawn["properties"][2]["value"])
    if not walkable(sx, sy):
        raise SystemExit(f"{label} spawn {(sx, sy)} is not walkable ({inv_name(names, ground[sy][sx])})")
    seen = set()
    stack = [(sx, sy)]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not walkable(x, y):
            continue
        seen.add((x, y))
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    for o in objects:
        if o["type"] not in ("spawn", "npc"):
            continue
        tx = int(next(p["value"] for p in o["properties"] if p["name"] == "tileX"))
        ty = int(next(p["value"] for p in o["properties"] if p["name"] == "tileY"))
        if (tx, ty) not in seen:
            raise SystemExit(f"{label} {o['name']} at {(tx, ty)} is not reachable from spawn")
    return seen


# --- tiled export ----------------------------------------------------------

def flat(layer):
    return [gid for row in layer for gid in row]


def write_json(path, ground, decor, collision, objects, legend):
    def layer(name, lid, data, visible=True):
        return {
            "id": lid,
            "name": name,
            "type": "tilelayer",
            "x": 0,
            "y": 0,
            "width": W,
            "height": H,
            "opacity": 1,
            "visible": visible,
            "data": flat(data),
        }

    obj_layer_objects = []
    for i, o in enumerate(objects, start=1):
        obj_layer_objects.append({**o, "id": i})
    doc = {
        "compressionlevel": -1,
        "width": W,
        "height": H,
        "infinite": False,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.10.2",
        "tilewidth": TILE,
        "tileheight": TILE,
        "type": "map",
        "version": "1.10",
        "nextlayerid": 5,
        "nextobjectid": len(objects) + 1,
        "properties": [
            {"name": "legend", "type": "string", "value": legend},
            {"name": "collision", "type": "string", "value": "Layer is hidden. Any gid > 0 blocks. Do not render it."},
            {"name": "sprites", "type": "string", "value": "32x32, 4 frames x 8 dirs S SW W NW N NE E SE, origin bottom-center"},
            {"name": "tileset", "type": "string", "value": "voyage_16"},
        ],
        "tilesets": [
            {
                "columns": COLS,
                "firstgid": 1,
                "image": "../tilesets/voyage_16.png",
                "imageheight": ROWS * TILE,
                "imagewidth": COLS * TILE,
                "margin": 0,
                "name": "voyage_16",
                "spacing": 0,
                "tilecount": COLS * ROWS,
                "tileheight": TILE,
                "tilewidth": TILE,
            }
        ],
        "layers": [
            layer("Ground", 1, ground, True),
            layer("Decor", 2, decor, True),
            layer("Collision", 3, collision, False),
            {
                "id": 4,
                "name": "Objects",
                "type": "objectgroup",
                "draworder": "topdown",
                "opacity": 1,
                "visible": True,
                "x": 0,
                "y": 0,
                "objects": obj_layer_objects,
            },
        ],
    }
    path.write_text(json.dumps(doc, indent=2) + "\n")


def xml_escape(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def write_tmx(path, ground, decor, collision, objects, legend):
    def csv(layer):
        lines = []
        for row in layer:
            lines.append(",".join(str(g) for g in row))
        return ",\n".join(lines)

    def props(pairs):
        body = []
        for name, typ, value in pairs:
            if typ == "bool":
                value = "true" if value else "false"
            body.append(
                f'    <property name="{xml_escape(name)}" type="{typ}" value="{xml_escape(value)}"/>'
            )
        return "<properties>\n" + "\n".join(body) + "\n   </properties>"

    obj_xml = []
    for i, o in enumerate(objects, start=1):
        plist = []
        for p in o["properties"]:
            plist.append((p["name"], p["type"], p["value"]))
        obj_xml.append(
            f'  <object id="{i}" name="{xml_escape(o["name"])}" type="{xml_escape(o["type"])}" '
            f'x="{o["x"]}" y="{o["y"]}">\n'
            f"   {props(plist)}\n"
            f"   <point/>\n"
            f"  </object>"
        )
    tmx = f'''<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.10.2" orientation="orthogonal" renderorder="right-down" width="{W}" height="{H}" tilewidth="{TILE}" tileheight="{TILE}" infinite="0" nextlayerid="5" nextobjectid="{len(objects)+1}">
 {props([
    ("legend", "string", legend),
    ("collision", "string", "Layer is hidden. Any gid > 0 blocks. Do not render it."),
    ("sprites", "string", "32x32, 4 frames x 8 dirs S SW W NW N NE E SE, origin bottom-center"),
    ("tileset", "string", "voyage_16"),
 ])}
 <tileset firstgid="1" name="voyage_16" tilewidth="{TILE}" tileheight="{TILE}" tilecount="{COLS*ROWS}" columns="{COLS}">
  <image source="../tilesets/voyage_16.png" width="{COLS*TILE}" height="{ROWS*TILE}"/>
 </tileset>
 <layer id="1" name="Ground" width="{W}" height="{H}">
  <data encoding="csv">
{csv(ground)}
  </data>
 </layer>
 <layer id="2" name="Decor" width="{W}" height="{H}">
  <data encoding="csv">
{csv(decor)}
  </data>
 </layer>
 <layer id="3" name="Collision" width="{W}" height="{H}" visible="0">
  <data encoding="csv">
{csv(collision)}
  </data>
 </layer>
 <objectgroup id="4" name="Objects" draworder="topdown">
{chr(10).join(obj_xml)}
 </objectgroup>
</map>
'''
    path.write_text(tmx)


# --- previews --------------------------------------------------------------

def render_map(ground, decor, objects, sheets, names):
    img = Image.new("RGBA", (W * TILE, H * TILE), SEA_DEEP)
    sheet, _ = sheets["tiles"]
    for layer in (ground, decor):
        for y in range(H):
            for x in range(W):
                gid = layer[y][x]
                if gid <= 0:
                    continue
                col = (gid - 1) % COLS
                row = (gid - 1) // COLS
                tile = sheet.crop((col * TILE, row * TILE, (col + 1) * TILE, (row + 1) * TILE))
                img.paste(tile, (x * TILE, y * TILE), tile)
    for o in objects:
        sprite_name = next((p["value"] for p in o["properties"] if p["name"] == "sprite"), None)
        if not sprite_name or sprite_name == "bag_of_winds":
            continue
        facing = next(p["value"] for p in o["properties"] if p["name"] == "facing")
        row = DIRS.index(facing)
        frame = {"siren_1": 0, "siren_2": 1, "siren_3": 2}.get(o["name"], 0)
        char = sheets[sprite_name]
        sprite = char.crop((frame * 32, row * 32, frame * 32 + 32, row * 32 + 32))
        # bottom-center at the object point
        ox = int(o["x"] - 16)
        oy = int(o["y"] - 30)
        img.paste(sprite, (ox, oy), sprite)
    return img


def captioned(img, title, subtitle):
    scale = 2
    big = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    label = Image.new("RGBA", (img.width, 28), INK)
    draw = ImageDraw.Draw(label)
    draw.text((6, 2), title, fill=GOLD_BRIGHT)
    draw.text((6, 14), subtitle, fill=FOAM)
    label = label.resize((big.width, 56), Image.NEAREST)
    canvas = Image.new("RGBA", (big.width, big.height + label.height), (14, 28, 36, 255))
    canvas.paste(label, (0, 0))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, label.height - 4, big.width, label.height), fill=GOLD)
    canvas.paste(big, (0, label.height))
    return canvas


def tileset_index(sheet, names):
    scale = 3
    label_h = 12
    cell = TILE * scale
    canvas = Image.new("RGBA", (COLS * cell, ROWS * (cell + label_h)), (24, 20, 16, 255))
    draw = ImageDraw.Draw(canvas)
    rev = {gid: name for name, gid in names.items()}
    for row in range(ROWS):
        for col in range(COLS):
            gid = row * COLS + col + 1
            tile = sheet.crop((col * TILE, row * TILE, (col + 1) * TILE, (row + 1) * TILE))
            # checker behind transparent tiles
            checker = Image.new("RGBA", (TILE, TILE), (40, 44, 48, 255))
            for y in range(TILE):
                for x in range(TILE):
                    if (x // 4 + y // 4) % 2 == 0:
                        checker.putpixel((x, y), (70, 74, 78, 255))
            checker.paste(tile, (0, 0), tile)
            big = checker.resize((cell, cell), Image.NEAREST)
            ox = col * cell
            oy = row * (cell + label_h)
            canvas.paste(big, (ox, oy))
            name = rev.get(gid, "")
            draw.text((ox + 2, oy + cell), f"{gid} {name}", fill=GOLD_BRIGHT)
    return canvas


def sprite_preview(sheets):
    gap = 8
    pieces = []
    labels = [
        ("siren  S SW W NW / N NE E SE", sheets["siren"]),
        ("crew_lantern", sheets["crew_lantern"]),
        ("aeolus", sheets["aeolus"]),
        ("bag_of_winds  4 frames", sheets["bag"]),
    ]
    width = max(im.width for _, im in labels) * 2 + 16
    height = sum(im.height * 2 + 18 for _, im in labels) + gap
    canvas = Image.new("RGBA", (width, height), (24, 28, 32, 255))
    draw = ImageDraw.Draw(canvas)
    y = 4
    for label, im in labels:
        draw.text((8, y), label, fill=GOLD_BRIGHT)
        y += 14
        # checker
        checker = Image.new("RGBA", im.size, (48, 56, 64, 255))
        cp = checker.load()
        for yy in range(im.height):
            for xx in range(im.width):
                if (xx // 8 + yy // 8) % 2 == 0:
                    cp[xx, yy] = (72, 80, 88, 255)
        checker.paste(im, (0, 0), im)
        big = checker.resize((im.width * 2, im.height * 2), Image.NEAREST)
        canvas.paste(big, (8, y))
        y += big.height + gap
    return canvas


def legend_for(names):
    parts = [f"{gid}:{name}" for name, gid in sorted(names.items(), key=lambda kv: kv[1])]
    return "voyage_16 gids " + " ".join(parts)


def manifest(names):
    return {
        "tileSize": TILE,
        "mapSize": [W, H],
        "tileset": {
            "name": "voyage_16",
            "image": "tilesets/voyage_16.png",
            "columns": COLS,
            "rows": ROWS,
            "tileWidth": TILE,
            "tileHeight": TILE,
            "gids": {name: gid for name, gid in sorted(names.items(), key=lambda kv: kv[1])},
        },
        "characters": {
            "frameWidth": 32,
            "frameHeight": 32,
            "framesPerDirection": 4,
            "directions": DIRS,
            "directionAxis": "rows top to bottom",
            "frameAxis": "columns left to right, walk cycle",
            "origin": "bottom-center",
            "sheets": {
                "siren": "sprites/siren_32.png",
                "crew_lantern": "sprites/crew_lantern_32.png",
                "aeolus": "sprites/aeolus_32.png",
            },
        },
        "props": {
            "bag_of_winds": {
                "image": "sprites/bag_of_winds_32.png",
                "frameWidth": 32,
                "frameHeight": 32,
                "frames": 4,
            }
        },
        "collision": "Collision layer is hidden. Any gid > 0 blocks movement. Do not render the layer.",
        "maps": [
            "maps/level3_sirens.json",
            "maps/level4_aeolus.json",
        ],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--artifacts", type=Path, required=True)
    args = parser.parse_args()
    root = args.root
    art = root / "public" / "assets"
    (art / "tilesets").mkdir(parents=True, exist_ok=True)
    (art / "sprites").mkdir(parents=True, exist_ok=True)
    (art / "maps").mkdir(parents=True, exist_ok=True)
    args.artifacts.mkdir(parents=True, exist_ok=True)

    sheet, names = build_tileset()
    sheet.save(art / "tilesets" / "voyage_16.png")

    siren = character_sheet(draw_siren)
    crew = character_sheet(draw_crew)
    aeolus = character_sheet(draw_aeolus)
    bag = bag_sheet()
    siren.save(art / "sprites" / "siren_32.png")
    crew.save(art / "sprites" / "crew_lantern_32.png")
    aeolus.save(art / "sprites" / "aeolus_32.png")
    bag.save(art / "sprites" / "bag_of_winds_32.png")

    sheets = {
        "tiles": (sheet, names),
        "siren": siren,
        "crew_lantern": crew,
        "aeolus": aeolus,
        "bag": bag,
    }
    legend = legend_for(names)

    g3, d3, c3, o3 = build_level3(names)
    g4, d4, c4, o4 = build_level4(names)
    write_json(art / "maps" / "level3_sirens.json", g3, d3, c3, o3, legend)
    write_tmx(art / "maps" / "level3_sirens.tmx", g3, d3, c3, o3, legend)
    write_json(art / "maps" / "level4_aeolus.json", g4, d4, c4, o4, legend)
    write_tmx(art / "maps" / "level4_aeolus.tmx", g4, d4, c4, o4, legend)
    (art / "sprites" / "manifest.json").write_text(json.dumps(manifest(names), indent=2) + "\n")

    p3 = captioned(
        render_map(g3, d3, o3, sheets, names),
        "Level 3  —  The Sirens' rocks",
        "Jagged stacks, crashing waves, crew lanterns. 40x30, 16px tiles.",
    )
    p4 = captioned(
        render_map(g4, d4, o4, sheets, names),
        "Level 4  —  Aeolus' floating island",
        "Bronze walls, sky, clouds, and the bag of winds. 40x30, 16px tiles.",
    )
    p3.save(args.artifacts / "level3_sirens_preview.png")
    p4.save(args.artifacts / "level4_aeolus_preview.png")
    tileset_index(sheet, names).save(args.artifacts / "voyage_16_tileset.png")
    sprite_preview(sheets).save(args.artifacts / "sprites_preview.png")

    # QA zooms
    zoom_dir = args.artifacts / "zoom"
    zoom_dir.mkdir(exist_ok=True)
    render_map(g3, d3, o3, sheets, names).crop((16, 80, 176, 320)).resize((640, 960), Image.NEAREST).save(zoom_dir / "l3_ship.png")
    render_map(g3, d3, o3, sheets, names).crop((280, 60, 560, 360)).resize((560, 600), Image.NEAREST).save(zoom_dir / "l3_rocks.png")
    render_map(g4, d4, o4, sheets, names).crop((140, 100, 520, 440)).resize((760, 680), Image.NEAREST).save(zoom_dir / "l4_island.png")
    siren.crop((0, 64, 32, 96)).resize((256, 256), Image.NEAREST).save(zoom_dir / "siren_W.png")
    crew.crop((0, 192, 32, 224)).resize((256, 256), Image.NEAREST).save(zoom_dir / "crew_E.png")
    aeolus.crop((0, 0, 32, 32)).resize((256, 256), Image.NEAREST).save(zoom_dir / "aeolus_S.png")
    bag.crop((0, 0, 32, 32)).resize((256, 256), Image.NEAREST).save(zoom_dir / "bag.png")

    print("tiles", len(names), "block", names["block"])
    print("level3 objects", [o["name"] for o in o3])
    print("level4 objects", [o["name"] for o in o4])
    print("wrote", art)


if __name__ == "__main__":
    main()
