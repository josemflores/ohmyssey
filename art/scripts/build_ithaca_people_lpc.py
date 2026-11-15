#!/usr/bin/env python3
"""Build Eumaeus and the suitors for Ithaca from Universal LPC layers.

Same pinned generator commit and 64 -> 32 shrink as build_odysseus_lpc.py.

Eumaeus, the old swineherd: an elderly face, white hair blown wild,
gray stubble, a rough brown long-sleeved tunic with a
darker kilt, a ragged brown cloak, and worn sandals.

The suitors, young lords feasting in Odysseus' hall, in three outfits, each
in four color combinations (12 sheets):
  a  two-tone chiton and bordered cloak: short-sleeved tunic, a kilt in the
     second color, a cloak with a border in the second color, short curls
  b  long robe: long-sleeved v-neck tunic with a sash at the waist, kilt,
     parted hair
  c  sleeveless tunic and plain cloak, with a sash, swept hair and a
     trimmed beard

Output, all in public/assets/sprites/npcs/ (4 columns x 8 rows of 32x32,
rows S SW W NW N NE E SE, the same layout as the older sheets, so the game
code reads them the same way). Each row is the LPC idle breath: frames
0, 0, 1, 1.

  eumaeus/eumaeus_32.png
  telemachus/telemachus_32.png
  suitor_lpc/suitor_a_1.png ... suitor_c_4.png

Run from the repo root (needs Pillow):

  python3 art/scripts/build_ithaca_people_lpc.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_odysseus_lpc as lpc  # noqa: E402  (shared download, shrink)

CACHE = Path(os.environ.get("LPC_CACHE", Path.home() / ".cache" / "ohmyssey-lpc"))
NPCS = lpc.ROOT / "public" / "assets" / "sprites" / "npcs"
PREVIEW = lpc.ROOT / "art" / "previews" / "ithaca-people-lpc.png"
SRC, OUT = lpc.SRC, lpc.OUT

# Idle sheets are 2 columns (breath in, breath out) by 4 rows (up, left, down, right).
IDLE_COLS, IDLE_ROWS = 2, 4
FRAMES = [0, 0, 1, 1]
# Row order of the 4x8 sheets: S SW W NW N NE E SE.
ROW_FACINGS = ["down", "left", "left", "left", "up", "right", "right", "right"]


# ----- Color ramps, darkest to lightest -------------------------------------
def ramp(*colors: str) -> list[str]:
    return list(colors)


WHITE_HAIR = ramp("#4a4a48", "#7c7c78", "#a8a8a2", "#cfcfc8", "#ecece6")
GRAY_STUBBLE = ramp("#5a5650", "#7a756e", "#9a948c")
BROWN_TUNIC = ramp("#24160e", "#3e2818", "#5a3c24", "#74502f", "#8c6640", "#a47c52")
DARK_KILT = ramp("#140c08", "#24160e", "#342216", "#46301e", "#5a3e28")
CLOAK_BROWN = ramp("#1e140c", "#33231a", "#4a3424", "#614532", "#7a5a42")
LEATHER = ramp("#2b1c1d", "#4b2b13", "#704325", "#9a6f37")
HAIR_DARK = ramp("#140e0a", "#2a1c12", "#3e2a1a", "#563a24", "#6e4a2e")
HAIR_BLACK = ramp("#0a0a0e", "#16161c", "#24242c", "#34343e", "#46464f")
HAIR_AUBURN = ramp("#2a0e08", "#4a1a0e", "#6a2a14", "#8a3e1e", "#a8562a")

# Suitor color combinations: (main cloth, accent cloth). Rich dyes, the
# suitors are wealthy men eating Odysseus' stores.
CRIMSON = ramp("#2a0608", "#4e0c10", "#76141a", "#9c2026", "#c03a34", "#de6a58")
GOLD = ramp("#3a2608", "#6a4810", "#9a6c1a", "#c49030", "#e2b452", "#f6d888")
ROYAL = ramp("#0a0e2a", "#141c4e", "#202e76", "#30449c", "#4c64c0", "#7a92de")
LINEN = ramp("#4a4236", "#7a6e5c", "#a89a82", "#cec2a8", "#e8dec8", "#f8f2e4")
PURPLE = ramp("#1a0a24", "#30123e", "#4a1e5c", "#66307c", "#84489c", "#a870bc")
SEA_GREEN = ramp("#081e1a", "#10342c", "#1a4e42", "#28685a", "#3e8676", "#68a898")
SAFFRON = ramp("#3a1e04", "#6a380a", "#9a5410", "#c8761e", "#e69a3a", "#f6c070")
CHARCOAL = ramp("#0e0e10", "#1c1c20", "#2a2a30", "#3a3a42", "#4e4e58", "#6a6a74")
COMBOS = [
    (CRIMSON, GOLD),
    (ROYAL, LINEN),
    (PURPLE, SAFFRON),
    (SEA_GREEN, CHARCOAL),
]


# ----- Layers -----------------------------------------------------------------
# Each layer: (id, LPC path to its idle sheet, ramp or None). Back to front.
# head=True layers stay on breath frame 0, because a one-pixel head bob
# turns into eye flicker at half size.
def eumaeus() -> list[dict]:
    return [
        {"id": "cloak-bg", "path": "cape/tattered/bg/idle.png", "ramp": CLOAK_BROWN},
        {"id": "body", "path": "body/bodies/male/idle.png"},
        {"id": "sandals", "path": "feet/sandals/male/idle.png", "ramp": LEATHER},
        {"id": "kilt", "path": "legs/skirts/plain/male/idle.png", "ramp": DARK_KILT},
        {"id": "tunic", "path": "torso/clothes/longsleeve/longsleeve/male/idle.png", "ramp": BROWN_TUNIC},
        {"id": "cloak-fg", "path": "cape/tattered/fg/idle.png", "ramp": CLOAK_BROWN},
        {"id": "head", "path": "head/heads/human/male_elderly/idle.png", "head": True},
        {"id": "stubble", "path": "beards/beard/5oclock_shadow/idle.png", "ramp": GRAY_STUBBLE, "head": True},
        {"id": "hair", "path": "hair/unkempt/adult/idle.png", "ramp": WHITE_HAIR, "head": True},
    ]


# Telemachus, Odysseus' son, a young man: short dark curls, no beard, an
# off-white long-sleeved shirt under dark gray leather armor, leather wrist
# wraps, dark trousers and sandals. The costume follows published set
# photos of a recent film's Telemachus (dark gray leather armor with wrist
# wraps over an off-white shirt); it is a costume, not anyone's likeness.
DARK_LEATHER_GRAY = ramp("#121214", "#1e1e22", "#2c2c31", "#3c3b40", "#4e4c52", "#646168")
WRAP_LEATHER = ramp("#1a120c", "#2e2016", "#463222", "#5e4630")
DARK_TROUSERS = ramp("#0e0c0a", "#1a1612", "#28221c", "#383028", "#4a4034")


def telemachus() -> list[dict]:
    return [
        {"id": "body", "path": "body/bodies/male/idle.png"},
        {"id": "sandals", "path": "feet/sandals/male/idle.png", "ramp": LEATHER},
        {"id": "trousers", "path": "legs/pants/male/idle.png", "ramp": DARK_TROUSERS},
        {"id": "shirt", "path": "torso/clothes/longsleeve/longsleeve/male/idle.png", "ramp": LINEN},
        {"id": "armor", "path": "torso/armour/leather/male/idle.png", "ramp": DARK_LEATHER_GRAY},
        {"id": "wraps", "path": "arms/wrists/lace/male/idle.png", "ramp": WRAP_LEATHER},
        {"id": "head", "path": "head/heads/human/male/idle.png", "head": True},
        {"id": "hair", "path": "hair/curly_short/adult/idle.png", "ramp": HAIR_DARK, "head": True},
    ]


def suitor(outfit: str, main: list[str], accent: list[str]) -> list[dict]:
    body = [
        {"id": "body", "path": "body/bodies/male/idle.png"},
        {"id": "sandals", "path": "feet/sandals/male/idle.png", "ramp": LEATHER},
    ]
    head = [{"id": "head", "path": "head/heads/human/male/idle.png", "head": True}]
    if outfit == "a":
        return [
            {"id": "cloak-bg", "path": "cape/solid/bg/idle.png", "ramp": main},
            *body,
            {"id": "kilt", "path": "legs/skirts/plain/male/idle.png", "ramp": accent},
            {"id": "tunic", "path": "torso/clothes/shortsleeve/shortsleeve/male/idle.png", "ramp": main},
            {"id": "cloak-fg", "path": "cape/solid/fg/idle.png", "ramp": main},
            {"id": "cloak-trim", "path": "cape/trim/idle.png", "ramp": accent},
            *head,
            {"id": "hair", "path": "hair/curly_short/adult/idle.png", "ramp": HAIR_DARK, "head": True},
        ]
    if outfit == "b":
        return [
            *body,
            {"id": "kilt", "path": "legs/skirts/plain/male/idle.png", "ramp": main},
            {"id": "tunic", "path": "torso/clothes/longsleeve/longsleeve2_vneck/male/idle.png", "ramp": main},
            {"id": "sash", "path": "torso/waist/obi/male/idle.png", "ramp": accent},
            *head,
            {"id": "hair", "path": "hair/parted/adult/idle.png", "ramp": HAIR_BLACK, "head": True},
        ]
    return [
        {"id": "cloak-bg", "path": "cape/solid/bg/idle.png", "ramp": accent},
        *body,
        {"id": "kilt", "path": "legs/skirts/plain/male/idle.png", "ramp": main},
        {"id": "tunic", "path": "torso/clothes/sleeveless/sleeveless2_scoop/male/idle.png", "ramp": main},
        {"id": "sash", "path": "torso/waist/obi/male/idle.png", "ramp": accent},
        {"id": "cloak-fg", "path": "cape/solid/fg/idle.png", "ramp": accent},
        *head,
        {"id": "beard", "path": "beards/beard/trimmed/idle.png", "ramp": HAIR_AUBURN, "head": True},
        {"id": "hair", "path": "hair/swoop/adult/idle.png", "ramp": HAIR_AUBURN, "head": True},
    ]


# ----- Building -----------------------------------------------------------------
def fetch(rel: str) -> Image.Image:
    dest = CACHE / "spritesheets" / rel
    if not dest.exists() or dest.stat().st_size == 0:
        dest.parent.mkdir(parents=True, exist_ok=True)
        import urllib.request

        print(f"download {rel}")
        urllib.request.urlretrieve(lpc.LPC_RAW + "spritesheets/" + rel, dest)
    image = Image.open(dest).convert("RGBA")
    if image.size != (IDLE_COLS * SRC, IDLE_ROWS * SRC):
        raise SystemExit(f"{rel} is {image.size}, expected a 2x4 idle sheet")
    return image


def by_lightness(image: Image.Image, target: list[str]) -> Image.Image:
    """Recolor a layer: its own shades, darkest to lightest, map onto the
    target ramp in the same order. Works whatever palette the layer came in."""
    colors = sorted(
        {px[:3] for px in image.getdata() if px[3]},
        key=lambda c: 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2],
    )
    if not colors:
        return image
    shades = [lpc.hex_rgb(c) for c in target]
    lut = {}
    for i, c in enumerate(colors):
        pos = round(i * (len(shades) - 1) / max(1, len(colors) - 1))
        lut[c] = shades[pos]
    out = image.copy()
    pixels = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a:
                pixels[x, y] = (*lut[(r, g, b)], a)
    return out


def build_sheet(layers: list[dict]) -> Image.Image:
    sheets = []
    for layer in layers:
        image = fetch(layer["path"])
        if layer.get("ramp"):
            image = by_lightness(image, layer["ramp"])
        sheets.append((image, layer.get("head", False)))
    rows = [lpc.LPC_ROWS[d] for d in ROW_FACINGS]
    out = Image.new("RGBA", (OUT * 4, OUT * 8))
    for r, lpc_row in enumerate(rows):
        for c, frame in enumerate(FRAMES):
            canvas = Image.new("RGBA", (SRC, SRC))
            for image, head in sheets:
                col = 0 if head else frame
                canvas.alpha_composite(image.crop((col * SRC, lpc_row * SRC, (col + 1) * SRC, (lpc_row + 1) * SRC)))
            out.paste(lpc.half_size(canvas), (c * OUT, r * OUT))
    return out


def main() -> None:
    built = {}
    path = NPCS / "eumaeus" / "eumaeus_32.png"
    built["eumaeus"] = build_sheet(eumaeus())
    path.parent.mkdir(parents=True, exist_ok=True)
    built["eumaeus"].save(path)
    print(f"wrote {path.relative_to(lpc.ROOT)}")
    built["telemachus"] = build_sheet(telemachus())
    path = NPCS / "telemachus" / "telemachus_32.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    built["telemachus"].save(path)
    print(f"wrote {path.relative_to(lpc.ROOT)}")
    for outfit in "abc":
        for n, (main_ramp, accent) in enumerate(COMBOS, start=1):
            name = f"suitor_{outfit}_{n}"
            built[name] = build_sheet(suitor(outfit, main_ramp, accent))
            path = NPCS / "suitor_lpc" / f"{name}.png"
            path.parent.mkdir(parents=True, exist_ok=True)
            built[name].save(path)
            print(f"wrote {path.relative_to(lpc.ROOT)}")
    # Preview: everyone facing south, then Eumaeus in all eight facings.
    names = list(built)
    board = Image.new("RGBA", (OUT * max(len(names), 8), OUT * 2), "#2a3040")
    for i, name in enumerate(names):
        board.alpha_composite(built[name].crop((0, 0, OUT, OUT)), (i * OUT, 0))
    for r in range(8):
        board.alpha_composite(built["eumaeus"].crop((0, r * OUT, OUT, (r + 1) * OUT)), (r * OUT, OUT))
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    board.resize((board.width * 4, board.height * 4), Image.NEAREST).save(PREVIEW)
    print(f"preview {PREVIEW.relative_to(lpc.ROOT)}")


if __name__ == "__main__":
    main()
