#!/usr/bin/env python3
"""Compose Odysseus idle and walk sheets from Universal LPC layers.

Pins a commit of
https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
and stacks the walk rows (up, left, down, right; 9 frames of 64x64).
Frame 0 of each row is the stand. Walk uses frames 1-8.

LPC only draws four directions. This sheet repeats them into the Troy order
s, se, e, ne, n, nw, w, sw:

  s -> down, n -> up, e/se/ne -> right, w/sw/nw -> left

Output frames are 32x32 (nearest half of 64x64) so he matches the old idle
cell. Feet already sit on the bottom row of the LPC frame, so the half-size
frame keeps that baseline.

Requires Pillow: python3 -m pip install pillow

Run from the repo root:

  python3 art/scripts/build_odysseus_lpc.py
"""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

from PIL import Image

LPC_COMMIT = "04140673ec02906f8233523639733c83690df750"
LPC_RAW = (
    "https://raw.githubusercontent.com/LiberatedPixelCup/"
    "Universal-LPC-Spritesheet-Character-Generator/"
    + LPC_COMMIT
    + "/"
)

ROOT = Path(__file__).resolve().parents[2]
LAYER_DIR = ROOT / "art" / "lpc" / "layers"
OUT_DIR = ROOT / "public" / "assets" / "sprites"

SRC = 64
OUT = 32
LPC_FRAMES = 9
# up, left, down, right — the order on every LPC walk sheet.
LPC_ROWS = {"up": 0, "left": 1, "down": 2, "right": 3}
# Troy facing order, and which LPC row supplies it.
FACINGS = [
    ("s", "down"),
    ("se", "right"),
    ("e", "right"),
    ("ne", "right"),
    ("n", "up"),
    ("nw", "left"),
    ("w", "left"),
    ("sw", "left"),
]
WALK_FRAME_COUNT = 8  # skip LPC frame 0 (the stand)

# Official ULPC palette rows. Sheets are saved in the source row; we swap
# to the target so he matches the dark-armor, red-crest reference.
ORANGE = ["#260D14", "#6A1108", "#A42600", "#BF4000", "#E55600", "#FF8A00"]
GRAY = ["#0E0E0E", "#292929", "#4B4B4B", "#777777", "#AAAAAA", "#D9D9D9"]
BROWN_CLOTH = ["#1D131E", "#411E05", "#4B2B13", "#62351C", "#744B30", "#996B4A"]
# Brighter than the stock cloth-red row so the crest still reads scarlet at 32px.
SCARLET = ["#1D131E", "#5A080C", "#A01012", "#C81816", "#E6201C", "#FF4630"]
STEEL = ["#1D131E", "#4D4A5D", "#726B7E", "#867E7F", "#C4B59F", "#FFFFFF"]
IRON = ["#000000", "#1B192B", "#29253A", "#343043", "#484152", "#726B7E"]
WHITE_CLOTH = ["#281820", "#4D4A5D", "#958080", "#C4B59F", "#E5E6C7", "#FFFFFF"]
LEATHER = ["#2B1C1D", "#311210", "#4B2B13", "#704325", "#75502D", "#9A6F37"]
CHARCOAL = ["#000000", "#130D14", "#1C2222", "#2A3034", "#4A5057", "#6E7675"]

# Back to front, using the generator's zPos.
LAYERS = [
    {
        "id": "cape-bg",
        "path": "spritesheets/cape/solid/bg/walk.png",
        "recolor": (WHITE_CLOTH, CHARCOAL),
        "note": "Solid cape, behind the body, charcoal",
    },
    {
        "id": "sword-bg",
        "path": "spritesheets/weapon/sword/arming/universal/bg/walk/steel.png",
        "note": "Arming sword, steel, behind the body",
    },
    {
        "id": "body",
        "path": "spritesheets/body/bodies/male/walk.png",
        "note": "Male body, light skin (the sheet's own palette)",
    },
    {
        "id": "sandals",
        "path": "spritesheets/feet/sandals/male/walk.png",
        "recolor": (WHITE_CLOTH, LEATHER),
        "note": "Sandals, recolored from the white cloth row to leather",
    },
    {
        "id": "pants",
        "path": "spritesheets/legs/pants/male/walk.png",
        "recolor": (WHITE_CLOTH, CHARCOAL),
        "note": "Pants, recolored from white cloth to charcoal",
    },
    {
        "id": "plate",
        "path": "spritesheets/torso/armour/plate/male/walk.png",
        "recolor": (STEEL, IRON),
        "note": "Plate cuirass, recolored from steel to iron",
    },
    {
        "id": "bracers",
        "path": "spritesheets/arms/bracers/male/walk.png",
        "recolor": (STEEL, IRON),
        "note": "Bracers, recolored from steel to iron",
    },
    {
        "id": "cape-fg",
        "path": "spritesheets/cape/solid/fg/walk.png",
        "recolor": (WHITE_CLOTH, CHARCOAL),
        "note": "Solid cape, in front of the torso, charcoal",
    },
    {
        "id": "head",
        "path": "spritesheets/head/heads/human/male/walk.png",
        "note": "Human male head, light skin, eyes included",
    },
    {
        "id": "beard",
        "path": "spritesheets/beards/beard/basic/walk.png",
        "recolor": (ORANGE, GRAY),
        "note": "Basic beard, recolored from orange to gray",
    },
    {
        "id": "helmet",
        "path": "spritesheets/hat/helmet/legion/adult/walk.png",
        "recolor": (STEEL, IRON),
        "note": "Legion helmet, recolored from steel to iron",
    },
    {
        "id": "plumage",
        "path": "spritesheets/hat/accessory/plumage_legion/adult/walk.png",
        "recolor": (BROWN_CLOTH, SCARLET),
        "note": "Legion plumage, recolored from brown cloth to scarlet",
    },
    {
        "id": "sword-fg",
        "path": "spritesheets/weapon/sword/arming/universal/fg/walk/steel.png",
        "note": "Arming sword, steel, in front of the body",
    },
]


def hex_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def fetch(rel: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return
    url = LPC_RAW + rel
    print(f"download {rel}")
    urllib.request.urlretrieve(url, dest)


def recolor(image: Image.Image, src: list[str], dst: list[str]) -> Image.Image:
    image = image.convert("RGBA")
    lut = {hex_rgb(a): hex_rgb(b) for a, b in zip(src, dst)}
    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            nxt = lut.get((r, g, b))
            if nxt is not None:
                pixels[x, y] = (*nxt, a)
    return image


def load_layer(layer: dict) -> Image.Image:
    dest = LAYER_DIR / f"{layer['id']}.png"
    fetch(layer["path"], dest)
    image = Image.open(dest)
    image.load()
    if image.size != (SRC * LPC_FRAMES, SRC * len(LPC_ROWS)):
        raise SystemExit(f"{layer['id']} is {image.size}, expected a 9x4 walk sheet")
    if layer.get("recolor"):
        image = recolor(image, *layer["recolor"])
    else:
        image = image.convert("RGBA")
    return image


def crop_frame(sheet: Image.Image, col: int, row: int) -> Image.Image:
    x = col * SRC
    y = row * SRC
    return sheet.crop((x, y, x + SRC, y + SRC))


def half_size(frame: Image.Image) -> Image.Image:
    """64 -> 32. Keep the bottom-most opaque pixel in each 2x2 so feet stay put."""
    src = frame.load()
    out = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
    dst = out.load()
    for y in range(OUT):
        for x in range(OUT):
            chosen = None
            for dy in (1, 0):
                for dx in (1, 0):
                    pixel = src[x * 2 + dx, y * 2 + dy]
                    if pixel[3]:
                        chosen = pixel
                        break
                if chosen is not None:
                    break
            if chosen is not None:
                dst[x, y] = chosen
    return out


def compose_frame(layers: list[Image.Image], col: int, row: int) -> Image.Image:
    frame = Image.new("RGBA", (SRC, SRC), (0, 0, 0, 0))
    for sheet in layers:
        frame.alpha_composite(crop_frame(sheet, col, row))
    return half_size(frame)


def paste_strip(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGBA", (OUT * len(frames), OUT), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.paste(frame, (index * OUT, 0))
    return sheet


def lowest_opaque_row(frame: Image.Image) -> int:
    pixels = frame.load()
    for y in range(frame.size[1] - 1, -1, -1):
        for x in range(frame.size[0]):
            if pixels[x, y][3]:
                return y
    return -1


def build() -> None:
    layers = [load_layer(layer) for layer in LAYERS]
    idle_frames = []
    walk_frames = []
    for _name, direction in FACINGS:
        row = LPC_ROWS[direction]
        idle_frames.append(compose_frame(layers, 0, row))
        for col in range(1, 1 + WALK_FRAME_COUNT):
            walk_frames.append(compose_frame(layers, col, row))

    idle = paste_strip(idle_frames)
    walk = paste_strip(walk_frames)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    idle_path = OUT_DIR / "odysseus_idle.png"
    walk_path = OUT_DIR / "odysseus_walk.png"
    idle.save(idle_path)
    walk.save(walk_path)

    feet = [lowest_opaque_row(frame) for frame in idle_frames + walk_frames]
    if any(row < OUT - 2 for row in feet):
        raise SystemExit(f"feet floated off the baseline: {feet}")
    print(f"wrote {idle_path.relative_to(ROOT)} {idle.size}")
    print(f"wrote {walk_path.relative_to(ROOT)} {walk.size}")
    print(f"feet rows (31 is the bottom pixel): min {min(feet)} max {max(feet)}")

    # A readable contact sheet: idle row, then one walk cycle per cardinal.
    preview = Image.new("RGBA", (OUT * 8, OUT * 5), (18, 22, 32, 255))
    for index, frame in enumerate(idle_frames):
        preview.paste(frame, (index * OUT, 0), frame)
    for facing_index, direction in enumerate(("down", "right", "up", "left")):
        row = LPC_ROWS[direction]
        for col in range(WALK_FRAME_COUNT):
            frame = compose_frame(layers, col + 1, row)
            preview.paste(frame, (col * OUT, (facing_index + 1) * OUT), frame)
    preview_path = Path("/opt/cursor/artifacts/odysseus-lpc-sheet.png")
    try:
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        big = preview.resize((preview.width * 4, preview.height * 4), Image.NEAREST)
        big.save(preview_path)
        print(f"preview {preview_path}")
    except OSError as exc:
        print(f"preview skipped: {exc}")


if __name__ == "__main__":
    try:
        build()
    except Exception as exc:  # noqa: BLE001 — surface the failure and stop
        print(exc, file=sys.stderr)
        raise
