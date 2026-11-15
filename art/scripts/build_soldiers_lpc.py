#!/usr/bin/env python3
"""Build the Greek and Trojan soldier sheets from Universal LPC layers.

Same pinned generator commit, palette swaps, and 64 -> 32 shrink as
build_odysseus_lpc.py, so the soldiers sit on the same pixel grid as him.

Who looks like what:
  Odysseus  dark iron armor, bright scarlet crest, charcoal cape, gray beard,
            sword. He is the only one with a cape, a beard, or a sword.
  Greeks    the same legion helmet and plate cuirass as Odysseus, but in
            bronze, with a dull maroon crest, a spear, and a Spartan shield.
  Trojans   one tone only, head to toe, skin included: every pixel is
            redrawn in a gray ramp (ASH) by how light it is. A different helmet
            (barbuta with a ridge crest), spear and shield.

Output (all 32x32 frames, origin bottom-center, in public/assets/sprites/npcs):

  <team>_lpc/<team>_idle.png            8 frames, one per facing (s se e ne n nw w sw)
  <team>_lpc/<team>_walk_32.png         4 columns x 8 rows (rows S SW W NW N NE E SE),
                                        same layout as the older greek_hoplite_32.png
  <team>_lpc/<team>_idle_animation.png  2 breathing frames per facing, facing order above
  <team>_lpc/<team>_attack.png          6 spear-thrust frames per facing
  <team>_lpc/<team>_hit.png             3 flinch frames per facing (LPC hurt faces south only)

Requires Pillow. Run from the repo root:

  python3 art/scripts/build_soldiers_lpc.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_odysseus_lpc as lpc  # noqa: E402  (shared fetch, recolor, shrink)

# Raw downloads are cached outside the repo so the art folder stays small.
CACHE = Path(os.environ.get("LPC_CACHE", Path.home() / ".cache" / "ohmyssey-lpc"))
OUT_ROOT = lpc.ROOT / "public" / "assets" / "sprites" / "npcs"
PREVIEW_DIR = lpc.ROOT / "art" / "previews"

SRC = lpc.SRC  # 64px LPC cells
OUT = lpc.OUT  # 32px game cells

# ----- Palettes -------------------------------------------------------------
# Every LPC metal piece is drawn in the STEEL row, cloth in WHITE_CLOTH, and so
# on. A palette swap maps each shade to the shade in the same position.
STEEL = lpc.STEEL
WHITE_CLOTH = lpc.WHITE_CLOTH
BROWN_CLOTH = lpc.BROWN_CLOTH
LEATHER = lpc.LEATHER
# The Spartan shield ships in its own brown/bronze shades, darkest first.
SHIELD = ["#2B1C1D", "#3E2613", "#62351C", "#744B30", "#996B4A", "#B88751", "#D9B75C"]
# The bronze spear tip and shaft, darkest first.
SPEAR = ["#2E2533", "#4D4A5D", "#4F2313", "#62351C", "#867E7F", "#B19998", "#C4B59F", "#E5E6C7", "#FBE3B0"]

# Greek bronze: warm, mid-bright, clearly lighter than Odysseus' dark iron.
BRONZE = ["#1D131E", "#4B2B13", "#7A4A1E", "#A0662A", "#D09A48", "#F2D088"]
# Greek crest: a dull maroon, so Odysseus' scarlet crest is the brightest red.
MAROON = ["#1D131E", "#33090E", "#4E1015", "#62161A", "#752220", "#8C302A"]
# Greek tunic: undyed linen.
LINEN = ["#281820", "#4D4A5D", "#8A7A6A", "#B0A08A", "#CFC2A8", "#E6DCC4"]

# Trojan teal ramp, darkest to lightest. Everything they wear uses it.
TEAL = ["#0A2228", "#145058", "#1E7480", "#2E96A0", "#56BCC2", "#A8E6E4"]
TEAL_DARK = ["#061317", "#0C2A30", "#123E46", "#1A5A64", "#246E78", "#3A8A92"]


def ramp(src: list[str], dst: list[str]) -> tuple[list[str], list[str]]:
    """Map a source shade list onto a target ramp by relative position."""
    out = []
    for index in range(len(src)):
        pos = round(index * (len(dst) - 1) / max(1, len(src) - 1))
        out.append(dst[pos])
    return src, out


# ----- Layers ---------------------------------------------------------------
# Each layer lists its sheet path with "{action}" where the animation name goes.
# Some LPC items have no idle sheet (spear, shield). For those, idle reuses the
# first walk frame, which is the same standing pose.

def greek_layers() -> list[dict]:
    return [
        {"id": "shield-bg", "path": "spritesheets/shield/spartan/bg/{action}/spartan.png", "no_idle": True},
        {"id": "spear-bg", "path": "spritesheets/weapon/polearm/spear/background/{action}/bronze.png", "no_idle": True},
        {"id": "body", "path": "spritesheets/body/bodies/male/{action}.png"},
        {"id": "sandals", "path": "spritesheets/feet/sandals/male/{action}.png", "recolor": (WHITE_CLOTH, LEATHER)},
        {"id": "pants", "path": "spritesheets/legs/pants/male/{action}.png", "recolor": (WHITE_CLOTH, LINEN)},
        {"id": "plate", "path": "spritesheets/torso/armour/plate/male/{action}.png", "recolor": (STEEL, BRONZE)},
        {"id": "bracers", "path": "spritesheets/arms/bracers/male/{action}.png", "recolor": (STEEL, BRONZE)},
        {"id": "head", "path": "spritesheets/head/heads/human/male/{action}.png", "head": True},
        {"id": "helmet", "path": "spritesheets/hat/helmet/legion/adult/{action}.png", "recolor": (STEEL, BRONZE), "head": True},
        {"id": "plumage", "path": "spritesheets/hat/accessory/plumage_legion/adult/{action}.png", "recolor": (BROWN_CLOTH, MAROON), "head": True},
        {"id": "shield-fg", "path": "spritesheets/shield/spartan/fg/{action}/spartan.png", "no_idle": True},
        {"id": "spear-fg", "path": "spritesheets/weapon/polearm/spear/foreground/{action}/bronze.png", "no_idle": True},
    ]


def trojan_layers() -> list[dict]:
    return [
        {"id": "shield-bg", "path": "spritesheets/shield/spartan/bg/{action}/spartan.png", "no_idle": True, "recolor": ramp(SHIELD, TEAL)},
        {"id": "spear-bg", "path": "spritesheets/weapon/polearm/spear/background/{action}/bronze.png", "no_idle": True, "recolor": ramp(SPEAR, TEAL)},
        {"id": "body", "path": "spritesheets/body/bodies/male/{action}.png"},
        {"id": "sandals", "path": "spritesheets/feet/sandals/male/{action}.png", "recolor": (WHITE_CLOTH, TEAL_DARK)},
        {"id": "pants", "path": "spritesheets/legs/pants/male/{action}.png", "recolor": (WHITE_CLOTH, TEAL_DARK)},
        {"id": "plate", "path": "spritesheets/torso/armour/plate/male/{action}.png", "recolor": (STEEL, TEAL)},
        {"id": "bracers", "path": "spritesheets/arms/bracers/male/{action}.png", "recolor": (STEEL, TEAL)},
        {"id": "head", "path": "spritesheets/head/heads/human/male/{action}.png", "head": True},
        {"id": "helmet", "path": "spritesheets/hat/helmet/barbuta/male/{action}.png", "recolor": (STEEL, TEAL), "head": True},
        {"id": "crest", "path": "spritesheets/hat/accessory/crest/adult/{action}.png", "recolor": (STEEL, TEAL), "head": True},
        {"id": "shield-fg", "path": "spritesheets/shield/spartan/fg/{action}/spartan.png", "no_idle": True, "recolor": ramp(SHIELD, TEAL)},
        {"id": "spear-fg", "path": "spritesheets/weapon/polearm/spear/foreground/{action}/bronze.png", "no_idle": True, "recolor": ramp(SPEAR, TEAL)},
    ]


TEAMS = {"greek": greek_layers, "trojan": trojan_layers}

# Trojans in one neutral tone: plain grays, no hue at all, like a statue.
# Lighter overall than Odysseus' near-black iron, so he still stands out.
ASH = ["#1C1C1C", "#3A3A3A", "#5C5C5C", "#808080", "#A6A6A6", "#D0D0D0"]

# Teams drawn in a single color. The ramp runs darkest to lightest.
MONOCHROME = {"trojan": ASH}


def monochrome(image: Image.Image, ramp_colors: list[str]) -> Image.Image:
    """Repaint every visible pixel with the ramp shade that matches its lightness.

    Outlines (darkest) get the darkest teal, skin and highlights (lightest)
    get the lightest, so the shapes still read but there is only one hue.
    """
    shades = [lpc.hex_rgb(c) for c in ramp_colors]
    image = image.copy()
    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            light = 0.299 * r + 0.587 * g + 0.114 * b  # 0 (black) to 255 (white)
            index = min(len(shades) - 1, int(light / 256 * len(shades) * 1.25))
            pixels[x, y] = (*shades[index], a)
    return image

# Columns and rows of each LPC animation sheet.
SHAPE = {"walk": (9, 4), "idle": (2, 4), "thrust": (8, 4), "hurt": (6, 1)}


def load(layer: dict, action: str) -> Image.Image:
    """Download (once) and palette-swap one layer for one animation."""
    source_action = "walk" if action == "idle" and layer.get("no_idle") else action
    rel = layer["path"].format(action=source_action)
    dest = CACHE / rel
    _fetch(rel, dest)
    image = Image.open(dest).convert("RGBA")
    cols, rows = SHAPE[source_action]
    if image.size != (cols * SRC, rows * SRC):
        raise SystemExit(f"{rel} is {image.size}, expected {cols}x{rows} cells")
    if layer.get("recolor"):
        image = lpc.recolor(image, *layer["recolor"])
    return image


def _fetch(rel: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return
    import urllib.request

    print(f"download {rel}")
    urllib.request.urlretrieve(lpc.LPC_RAW + rel, dest)


def compose_frame(team_layers: list[dict], sheets: list[Image.Image], action: str, col: int, row: int) -> Image.Image:
    """Stack every layer's cell for one frame, then shrink it to 32x32."""
    canvas = Image.new("RGBA", (SRC, SRC))
    for layer, sheet in zip(team_layers, sheets):
        c = col
        if action == "idle" and layer.get("no_idle"):
            c = 0  # walk frame 0 is the stand
        # Keep the head still while breathing. A one-pixel head bob turns
        # into eye flicker at half size (same fix as Odysseus).
        if action == "idle" and layer.get("head"):
            c = 0
        canvas.alpha_composite(sheet.crop((c * SRC, row * SRC, (c + 1) * SRC, (row + 1) * SRC)))
    return lpc.half_size(canvas)


def strip(frames: list[Image.Image], columns: int | None = None) -> Image.Image:
    columns = columns or len(frames)
    rows = (len(frames) + columns - 1) // columns
    sheet = Image.new("RGBA", (OUT * columns, OUT * rows))
    for index, image in enumerate(frames):
        sheet.paste(image, ((index % columns) * OUT, (index // columns) * OUT))
    return sheet


# Which columns of each LPC sheet become our frames.
IDLE_COLS = [0, 1]
# Thrust: draw the spear back (1-3), drive it forward (4, 6), back to ready (0).
ATTACK_COLS = [1, 2, 3, 4, 6, 0]
# Hurt: a standing flinch and back. Frames 2+ fall to the ground.
HIT_COLS = [0, 1, 0]
# Walk sheet for the world scenes: four steps of the LPC cycle.
WALK_COLS = [0, 2, 4, 6]
# Row order of the older 4x8 hoplite sheets: S SW W NW N NE E SE.
WALK_ROW_FACINGS = ["down", "left", "left", "left", "up", "right", "right", "right"]


def build_team(team: str) -> dict[str, Image.Image]:
    layers = TEAMS[team]()
    out: dict[str, Image.Image] = {}
    sheets = {action: [load(layer, action) for layer in layers] for action in SHAPE}

    def facing_rows():
        return [lpc.LPC_ROWS[direction] for _name, direction in lpc.FACINGS]

    ramp_colors = MONOCHROME.get(team)

    def frame(*args):
        # Build one frame, then repaint it in one color if this team is monochrome.
        image = compose_frame(*args)
        return monochrome(image, ramp_colors) if ramp_colors else image

    out["idle"] = strip([frame(layers, sheets["walk"], "walk", 0, row) for row in facing_rows()])
    out["idle_animation"] = strip(
        [frame(layers, sheets["idle"], "idle", col, row) for row in facing_rows() for col in IDLE_COLS]
    )
    out["attack"] = strip(
        [frame(layers, sheets["thrust"], "thrust", col, row) for row in facing_rows() for col in ATTACK_COLS]
    )
    # LPC hurt only faces south, so every facing reuses that row.
    out["hit"] = strip([frame(layers, sheets["hurt"], "hurt", col, 0) for _ in range(8) for col in HIT_COLS])
    walk = []
    for direction in WALK_ROW_FACINGS:
        row = lpc.LPC_ROWS[direction]
        walk.extend(frame(layers, sheets["walk"], "walk", col, row) for col in WALK_COLS)
    out["walk_32"] = strip(walk, columns=4)
    return out


def save(team: str, sheets: dict[str, Image.Image]) -> None:
    folder = OUT_ROOT / f"{team}_lpc"
    folder.mkdir(parents=True, exist_ok=True)
    for name, image in sheets.items():
        path = folder / f"{team}_{name}.png"
        image.save(path)
        print(f"wrote {path.relative_to(lpc.ROOT)} {image.size}")


def preview(all_sheets: dict[str, dict[str, Image.Image]]) -> None:
    """One picture: Odysseus, a Greek, a Trojan, facing south and east, plus actions."""
    hero = Image.open(lpc.OUT_DIR / "odysseus_idle.png").convert("RGBA")
    board = Image.new("RGBA", (OUT * 16, OUT * 4), "#2a3040")
    # Row 0: south and east idle for all three.
    for i, idle in enumerate([hero, all_sheets["greek"]["idle"], all_sheets["trojan"]["idle"]]):
        for j, facing in enumerate([0, 2, 6]):
            cell = idle.crop((facing * OUT, 0, (facing + 1) * OUT, OUT))
            board.alpha_composite(cell, ((i * 3 + j) * OUT, 0))
    # Rows 1-3 per team: attack (east) then hit, for Greek (row 1) and Trojan (row 2).
    for r, team in enumerate(["greek", "trojan"], start=1):
        sheets = all_sheets[team]
        n = len(ATTACK_COLS)
        for k in range(n):
            idx = 2 * n + k  # east
            board.alpha_composite(sheets["attack"].crop((idx * OUT, 0, (idx + 1) * OUT, OUT)), (k * OUT, r * OUT))
        for k in range(3):
            board.alpha_composite(sheets["hit"].crop((k * OUT, 0, (k + 1) * OUT, OUT)), ((n + 1 + k) * OUT, r * OUT))
        for k in range(2):
            idx = 6 * 2 + k  # west, as the foe stands in battle
            board.alpha_composite(sheets["idle_animation"].crop((idx * OUT, 0, (idx + 1) * OUT, OUT)), ((n + 5 + k) * OUT, r * OUT))
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    path = PREVIEW_DIR / "soldiers-lpc.png"
    board.resize((board.width * 4, board.height * 4), Image.NEAREST).save(path)
    print(f"preview {path.relative_to(lpc.ROOT)}")


def main() -> None:
    teams = sys.argv[1:] or list(TEAMS)
    built = {}
    for team in teams:
        built[team] = build_team(team)
        save(team, built[team])
    if set(built) == set(TEAMS):
        preview(built)


if __name__ == "__main__":
    main()
