#!/usr/bin/env python3
"""Build Odysseus disguised as a beggar from Universal LPC layers.

Odyssey 13: Athena withers his skin, takes the hair from his head, dims his
eyes, and dresses him in a ragged tunic and wrap, filthy and black with
smoke, with the bald hide of a deer over it, a staff, and a poor bag.

So the LPC stack is: an elderly face, a bald crown with a thin gray fringe,
a gray beard (Odysseus keeps his beard), a soot-stained long-sleeved
tunic over a dark kilt, a tattered cloak in pale deer-hide tan, worn
sandals, and a walking staff (the LPC cane).

Same pinned generator commit and 64 -> 32 shrink as build_odysseus_lpc.py,
and the same sheets, sizes, and facing order as the old beggar sheets, so
Level2Scene loads them unchanged (public/assets/sprites/odysseus_beggar/):

  idle.png            8 frames, one per facing (s se e ne n nw w sw)
  walk.png            8 steps per facing
  idle_animation.png  2 breathing frames per facing
  attack.png          6 staff-thrust frames per facing, in 64x64 cells
  hit.png             3 flinch frames per facing (LPC hurt faces south)
  bow_shoot_e.png     13 LPC shoot frames facing east, with the arrow
  bow_draw_e.png      the same 13 frames without the arrow

and the battle bow sheets in public/assets/battle/ (odysseus_bow_*_e.png).

Run from the repo root (needs Pillow):

  python3 art/scripts/build_odysseus_beggar_lpc.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_odysseus_lpc as lpc  # noqa: E402

CACHE = Path(os.environ.get("LPC_CACHE", Path.home() / ".cache" / "ohmyssey-lpc"))
OUT_DIR = lpc.ROOT / "public" / "assets" / "sprites" / "odysseus_beggar"
PREVIEW = lpc.ROOT / "art" / "previews" / "odysseus-beggar-lpc.png"
SRC, OUT = lpc.SRC, lpc.OUT

# Columns x rows of each LPC animation sheet.
SHAPE = {"walk": (9, 4), "idle": (2, 4), "thrust": (8, 4), "hurt": (6, 1), "shoot": (13, 4)}

# Darkest to lightest.
GRAY_FRINGE = ["#3e3c3a", "#62605c", "#8a8782", "#aeaaa4", "#cac6c0"]
GRAY_BEARD = ["#3a3836", "#5e5b57", "#85817b", "#a9a49d", "#c6c1b9"]
SOOT_TUNIC = ["#151210", "#24201c", "#35302a", "#48423a", "#5c554b", "#726a5e"]
DIRTY_KILT = ["#100c0a", "#1c1612", "#2a221c", "#3a3026", "#4a3e32"]
DEER_HIDE = ["#3a2a1c", "#5a4430", "#7a5e44", "#98785a", "#b49470", "#ccae8a"]
WORN_LEATHER = ["#20160e", "#3a2818", "#563c24", "#6e5032"]
OLD_WOOD = ["#2a1c10", "#4a321c", "#6a4a2a", "#8a6a40", "#a88a5c"]

# Back to front. no=... lists animations a layer does not have; those use its
# walk sheet's standing frame instead. head layers stay still while breathing.
LAYERS = [
    {"id": "hide-bg", "path": "cape/tattered/bg/{a}.png", "ramp": DEER_HIDE},
    {"id": "body", "path": "body/bodies/male/{a}.png"},
    {"id": "sandals", "path": "feet/sandals/male/{a}.png", "ramp": WORN_LEATHER},
    {"id": "kilt", "path": "legs/skirts/plain/male/{a}.png", "ramp": DIRTY_KILT},
    {"id": "tunic", "path": "torso/clothes/longsleeve/longsleeve/male/{a}.png", "ramp": SOOT_TUNIC},
    {"id": "hide-fg", "path": "cape/tattered/fg/{a}.png", "ramp": DEER_HIDE},
    {"id": "head", "path": "head/heads/human/male_elderly/{a}.png", "head": True},
    {"id": "beard", "path": "beards/beard/basic/{a}.png", "ramp": GRAY_BEARD, "head": True},
    {"id": "fringe", "path": "hair/balding/adult/{a}.png", "ramp": GRAY_FRINGE, "head": True},
    {"id": "staff", "path": "weapon/polearm/cane/male/{a}/cane.png", "ramp": OLD_WOOD,
     "no": {"idle", "hurt"}},
]


def fetch(rel: str) -> Image.Image:
    dest = CACHE / "spritesheets" / rel
    if not dest.exists() or dest.stat().st_size == 0:
        dest.parent.mkdir(parents=True, exist_ok=True)
        import urllib.request

        print(f"download {rel}")
        urllib.request.urlretrieve(lpc.LPC_RAW + "spritesheets/" + rel, dest)
    return Image.open(dest).convert("RGBA")


def by_lightness(image: Image.Image, target: list[str]) -> Image.Image:
    """Map the layer's own shades, darkest to lightest, onto the target ramp."""
    colors = sorted(
        {px[:3] for px in image.getdata() if px[3]},
        key=lambda c: 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2],
    )
    if not colors:
        return image
    shades = [lpc.hex_rgb(c) for c in target]
    lut = {c: shades[round(i * (len(shades) - 1) / max(1, len(colors) - 1))] for i, c in enumerate(colors)}
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (*lut[(r, g, b)], a)
    return out


def load(layer: dict, action: str) -> tuple[Image.Image, str]:
    source = "walk" if action in layer.get("no", set()) else action
    image = fetch(layer["path"].format(a=source))
    cols, rows = SHAPE[source]
    if image.size != (cols * SRC, rows * SRC):
        raise SystemExit(f"{layer['path'].format(a=source)} is {image.size}, expected {cols}x{rows}")
    if layer.get("ramp"):
        image = by_lightness(image, layer["ramp"])
    return image, source


def frame(stack, action: str, col: int, row: int) -> Image.Image:
    canvas = Image.new("RGBA", (SRC, SRC))
    for layer, (image, source) in stack:
        c = col
        if source != action:
            # Borrowed from the walk sheet: its standing frame, same facing
            # (hurt only has one row, which faces south, row 2 of walk).
            c = 0
            r = lpc.LPC_ROWS["down"] if action == "hurt" else row
        else:
            r = row
        if action == "idle" and layer.get("head"):
            c = 0
        canvas.alpha_composite(image.crop((c * SRC, r * SRC, (c + 1) * SRC, (r + 1) * SRC)))
    return lpc.half_size(canvas)


def strip(frames: list[Image.Image], size: int = OUT) -> Image.Image:
    sheet = Image.new("RGBA", (size * len(frames), size))
    for i, f in enumerate(frames):
        inset = (size - f.width) // 2
        sheet.paste(f, (i * size + inset, inset))
    return sheet


# The great bow of Odysseus (Odyssey 21-22): the LPC recurve bow in plain
# wood, with an arrow. Used for the contest and the fight in the hall.
BOW_DIR = lpc.ROOT / "public" / "assets" / "battle"
BOW_LAYERS = [
    {"id": "bow-bg", "path": "weapon/ranged/bow/recurve/universal/background/shoot/medium.png", "first": True},
    {"id": "bow-fg", "path": "weapon/ranged/bow/recurve/universal/foreground/shoot/medium.png"},
    {"id": "arrow", "path": "weapon/ranged/bow/arrow/shoot/arrow.png"},
]
# LPC shoot frames: 0-3 raise the bow, 4 arrow nocked, 5-8 draw to full,
# 9 release, 10-12 lower it again.
BOW_IDLE = [12, 11]
BOW_SHOOT = [4, 6, 8, 9, 10, 12]


def bow_frame(col: int, row: int, arrow: bool = True) -> Image.Image:
    """The beggar (no staff) with the bow, one 64px LPC cell shrunk to 32.
    arrow=False leaves the arrow off (stringing and testing the bow)."""
    canvas = Image.new("RGBA", (SRC, SRC))
    body = [l for l in LAYERS if l["id"] != "staff"]
    bow_fg = BOW_LAYERS[1:] if arrow else BOW_LAYERS[1:2]
    for layer in [BOW_LAYERS[0], *body, *bow_fg]:
        if layer in BOW_LAYERS:
            image = fetch(layer["path"])
        else:
            image, _src = load(layer, "shoot")
        canvas.alpha_composite(image.crop((col * SRC, row * SRC, (col + 1) * SRC, (row + 1) * SRC)))
    return lpc.half_size(canvas)


def king_bow_frame(col: int, row: int) -> Image.Image:
    """Odysseus the king (the armour, helmet and cape of build_odysseus_lpc.py,
    sword put away) with the bow, from the same layers' shoot sheets."""
    canvas = Image.new("RGBA", (SRC, SRC))
    body = []
    for layer in lpc.LAYERS:
        if layer["id"].startswith("sword"):
            continue
        rel = layer["path"].removeprefix("spritesheets/").replace("/walk.png", "/shoot.png").replace("/walk/", "/shoot/")
        image = fetch(rel)
        if image.size != (13 * SRC, 4 * SRC):
            raise SystemExit(f"{rel} is {image.size}, expected a 13x4 shoot sheet")
        if layer.get("recolor"):
            image = lpc.recolor(image, *layer["recolor"])
        body.append(image)
    bow_bg, bow_fg, arrow = (fetch(l["path"]) for l in BOW_LAYERS)
    for image in [bow_bg, *body, bow_fg, arrow]:
        canvas.alpha_composite(image.crop((col * SRC, row * SRC, (col + 1) * SRC, (row + 1) * SRC)))
    return lpc.half_size(canvas)


def build_bow_sheets() -> None:
    """For the fight in the hall: odysseus_bow_idle_e.png (2 frames) and
    odysseus_bow_shoot_e.png (6 frames: nock, draw, full draw, release,
    lower, rest), 32x32, facing east. In battle he is the king again, so
    these use his armoured LPC look, not the beggar's rags."""
    east = lpc.LPC_ROWS["right"]
    BOW_DIR.mkdir(parents=True, exist_ok=True)
    for name, cols in (("odysseus_bow_idle_e", BOW_IDLE), ("odysseus_bow_shoot_e", BOW_SHOOT)):
        sheet = strip([king_bow_frame(c, east) for c in cols])
        sheet.save(BOW_DIR / f"{name}.png")
        print(f"wrote {(BOW_DIR / f'{name}.png').relative_to(lpc.ROOT)} {sheet.size}")
    # All 13 LPC shoot frames, with and without the arrow, for the cutscene
    # pictures (art/scripts/build_hall_contest.py): raise, nock, draw,
    # release, lower.
    for name, arrow in (("bow_shoot_e", True), ("bow_draw_e", False)):
        sheet = strip([bow_frame(c, east, arrow) for c in range(13)])
        sheet.save(OUT_DIR / f"{name}.png")
        print(f"wrote {(OUT_DIR / f'{name}.png').relative_to(lpc.ROOT)} {sheet.size}")


def main() -> None:
    stacks = {a: [(layer, load(layer, a)) for layer in LAYERS if a != "shoot" or layer["id"] != "staff"] for a in SHAPE if a != "shoot"}
    rows = [lpc.LPC_ROWS[d] for _n, d in lpc.FACINGS]
    sheets = {
        "idle": strip([frame(stacks["walk"], "walk", 0, r) for r in rows]),
        "walk": strip([frame(stacks["walk"], "walk", c, r) for r in rows for c in range(1, 9)]),
        "idle_animation": strip([frame(stacks["idle"], "idle", c, r) for r in rows for c in (0, 1)]),
        # A short jab with the staff: draw back, thrust, recover.
        "attack": strip([frame(stacks["thrust"], "thrust", c, r) for r in rows for c in (1, 2, 3, 4, 6, 0)], 64),
        # The standing flinch only; the later hurt frames fall down.
        "hit": strip([frame(stacks["hurt"], "hurt", c, 0) for _ in rows for c in (0, 1, 0)]),
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, image in sheets.items():
        image.save(OUT_DIR / f"{name}.png")
        print(f"wrote {(OUT_DIR / f'{name}.png').relative_to(lpc.ROOT)} {image.size}")
    # Preview: the 8 facings, then a walk cycle facing east.
    board = Image.new("RGBA", (OUT * 8, OUT * 2), "#2a3040")
    board.alpha_composite(sheets["idle"], (0, 0))
    board.alpha_composite(sheets["walk"].crop((2 * 8 * OUT, 0, 3 * 8 * OUT, OUT)), (0, OUT))
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    board.resize((board.width * 4, board.height * 4), Image.NEAREST).save(PREVIEW)
    print(f"preview {PREVIEW.relative_to(lpc.ROOT)}")
    build_bow_sheets()


if __name__ == "__main__":
    main()
