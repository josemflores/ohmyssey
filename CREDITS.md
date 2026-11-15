# Credits

## Sprites

The Odysseus, Greek, and Trojan idle sheets were made in PixelLab by the Ohmyssey team.

- `public/assets/sprites/odysseus_idle.png`
- `public/assets/sprites/greek_idle.png`
- `public/assets/sprites/trojan_idle.png`

Each sheet is 256×32: eight frames of 32×32, one facing each, in this order: south, south-east, east, north-east, north, north-west, west, south-west.

There is no walk cycle. The game bobs the idle frame while a character moves. `ANIM_CONFIG` in `src/game/animConfig.js` and `WARRIOR_CONFIG` in `src/game/warriorConfig.js` are where a walk sheet would plug in.

## Scenery

The beach, wall, temple, houses, horse, and props are drawn in code (`src/game/textures.js`). No downloaded tileset. `src/game/warriorArt.js` is only a fallback for a team whose sprite path is empty.

## Fonts

Cinzel and Source Sans 3 are loaded from Google Fonts, the same way the rest of Ohmyssey already does.
