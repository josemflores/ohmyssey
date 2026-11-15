"""Build animated idle, sword attack, and flinch from the pinned LPC generator.

Run from the repo root: python art/scripts/build_odysseus_actions.py
Uses the same layers, palette swaps, and attribution as build_odysseus_lpc.py.
The larger attack cells leave room for the sword without shrinking the hero.
"""
from pathlib import Path

from PIL import Image
import build_odysseus_lpc as lpc


def layers_for(action):
    layers = []
    for layer in lpc.LAYERS:
        path = layer['path'].replace('/walk', '/' + action)
        sword = layer['id'].startswith('sword-')
        if action == 'slash' and sword:
            side = layer['id'].split('-')[1]
            path = f'spritesheets/weapon/sword/arming/attack_slash/{side}/steel.png'
        dest = lpc.LAYER_DIR / action / (layer['id'] + '.png')
        lpc.fetch(path, dest)
        image = Image.open(dest).convert('RGBA')
        cell = 128 if action == 'slash' and sword else 64
        columns = {'idle': 2, 'slash': 6, 'hurt': 6}[action]
        rows = 1 if action == 'hurt' else 4
        if image.size != (columns * cell, rows * cell):
            raise ValueError(f'Unexpected LPC layout: {path}: {image.size}')
        if layer.get('recolor'):
            image = lpc.recolor(image, *layer['recolor'])
        # LPC moves the head by one source pixel while breathing. At half
        # resolution that samples a different row of the eyes, causing a color
        # flicker. Keep the head assembly still; the torso and arms still breathe.
        fixed_head = action == 'idle' and layer['id'] in {'head', 'beard', 'helmet', 'plumage'}
        layers.append((image, cell, fixed_head))
    return layers


def compose(layers, column, row, size):
    canvas = Image.new('RGBA', (size, size))
    for sheet, cell, fixed_head in layers:
        source_column = 0 if fixed_head else column
        frame = sheet.crop((source_column * cell, row * cell,
                            (source_column + 1) * cell, (row + 1) * cell))
        # LPC's oversize weapons center the original 64px body in a 128px cell.
        inset = (size - cell) // 2
        canvas.alpha_composite(frame, (inset, inset))
    # Use the same pixel selection as the existing walk sheet at half scale.
    if size == 64:
        return lpc.half_size(canvas)
    result = Image.new('RGBA', (64, 64))
    for y in range(2):
        for x in range(2):
            tile = canvas.crop((x * 64, y * 64, (x + 1) * 64, (y + 1) * 64))
            result.paste(lpc.half_size(tile), (x * 32, y * 32))
    return result


def build():
    specs = [('idle', 'idle_animation', [0, 1], 64),
             # Reverse the LPC rising slash: blade overhead, downward cut, recovery.
             ('slash', 'attack', [5, 4, 3, 2, 1, 0], 128),
             # LPC hurt ends by falling down. Only the standing flinch is used
             # for an ordinary hit, then it returns to the standing pose.
             ('hurt', 'hit', [0, 1, 0], 64)]
    preview = Image.new('RGBA', (384, 192), '#121620')
    for preview_row, (action, name, columns, size) in enumerate(specs):
        layers = layers_for(action)
        frames = []
        for _, direction in lpc.FACINGS:
            # LPC hurt is south-facing only; do not pretend it has four views.
            row = 0 if action == 'hurt' else lpc.LPC_ROWS[direction]
            frames.extend(compose(layers, col, row, size) for col in columns)
        width = size // 2
        strip = Image.new('RGBA', (width * len(frames), width))
        for index, frame in enumerate(frames):
            strip.paste(frame, (index * width, 0))
        output = lpc.OUT_DIR / f'odysseus_{name}.png'
        strip.save(output)
        print(f'{output.name}: {strip.size}, {len(columns)} frames per facing')
        # Preview east, the direction used by the battle screen.
        for index, frame in enumerate(frames[2 * len(columns):3 * len(columns)]):
            preview.alpha_composite(frame, (index * 64 + (64 - width) // 2,
                                             preview_row * 64 + (64 - width) // 2))
    preview_dir = lpc.ROOT / 'art' / 'previews'
    preview_dir.mkdir(exist_ok=True)
    preview.resize((1152, 576), Image.Resampling.NEAREST).save(preview_dir / 'odysseus-actions.png')


if __name__ == '__main__':
    build()
