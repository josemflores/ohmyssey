# Monster encounters

Random fights for the main walk. Level 1 is the fall of Troy (voltage, current, resistance, Ohm's law with small numbers, series and parallel, switches, LED polarity, batteries). Level 2 is the return to Ithaca (simple circuits, resistor color bands, capacitors, safety).

A correct answer damages the monster. A wrong answer costs Odysseus a heart and shows a short explanation. Three hearts, and the foe has 2 or 3. The fight ends on a win, a loss, or a slip-away.

Phaser does not import React. App does not import Phaser's battle code. They meet on two window events.

| Event | Who fires it | Detail |
| --- | --- | --- |
| `ohmyssey:encounter` | `requestEncounter(level)` from `src/game` | `{ level, monsterId? }` |
| `ohmyssey:encounter-result` | `<EncounterHost />` when the fight ends | `{ win, reason }` |

`win` is `true` only when the monster's HP hits 0. `reason` is `'win'`, `'lose'`, or `'flee'`. A second encounter fired while one is open is ignored.

While the overlay is up it sets `document.body.dataset.encounter` to `'open'` and removes it on close. Kevin can read that flag from the Phaser update loop and stop the hero without importing the component.

## Kevin — call it from `src/game`

Tiles are 16px (`TILE` in `src/game/map.js`) and Odysseus moves at 80px/s, so he crosses about five tiles a second. Roll when he enters a new tile. `STEP_CHANCE = 0.008` is about one fight per 25 seconds of walking. Raise it while testing.

Suggested place: `update` in `src/game/TroyScene.js`, after the hero velocity is applied. This file is yours; the snippet is not wired in.

```js
import { requestEncounter, ENCOUNTER_RESULT_EVENT } from '../learn/encounters/bus.js';
import { TILE } from './map.js';

const STEP_CHANCE = 0.008;

// create(), after the keyboard is set up:
this.encounterOpen = false;
this.lastTile = null;
this.onEncounterResult = (event) => {
  this.encounterOpen = false;
  this.input.keyboard.enabled = true;
  const { win } = event.detail;
  if (!win) {
    // Loss or flee. Leave him where he is, or step him back a tile.
  }
};
window.addEventListener(ENCOUNTER_RESULT_EVENT, this.onEncounterResult);

// shutdown:
window.removeEventListener(ENCOUNTER_RESULT_EVENT, this.onEncounterResult);

// Top of update(), before velocity is applied. Returning here also
// skips this.battle.update, so the standoff holds still during the question.
if (document.body.dataset.encounter === 'open' || this.encounterOpen) {
  this.feet.setVelocity(0, 0);
  this.input.keyboard.enabled = false;
  return;
}

// update(), once the new feet position is known:
const tileX = Math.round(this.feet.x / TILE);
const tileY = Math.round(this.feet.y / TILE);
const tileKey = tileX + ',' + tileY;
if (!this.encounterOpen && tileKey !== this.lastTile) {
  this.lastTile = tileKey;
  if (Math.random() < STEP_CHANCE) {
    this.encounterOpen = true;
    this.feet.setVelocity(0, 0);
    this.input.keyboard.enabled = false;
    requestEncounter(1); // Troy. Pass 2 on the Ithaca map.
    // requestEncounter(1, { monsterId: 'trojan-shade' }) locks the foe.
  }
}
```

`requestEncounter` only dispatches the event. If `<EncounterHost />` is not mounted, nothing appears and no result event follows, so keep `encounterOpen` in step with the result listener (and treat a missing host as "no fight" if you add a timeout later).

Do not import `MonsterEncounter.jsx` or `EncounterHost.jsx` into the Phaser scene.

## Jose — mount the host in `src/App.jsx`

One sibling, after the screens, so the card sits on top of login, the story, and Troy. `src/App.jsx` is yours; this is not wired in.

```jsx
import EncounterHost from './components/EncounterHost.jsx';

// inside the return:
<div className="app-shell">
  {screen === 'login' && <LoginScreen onEnter={() => setScreen('intro')} />}
  {screen === 'intro' && <IntroScreen onBegin={() => setScreen('world')} />}
  {screen === 'world' && <TroyWorld />}
  <EncounterHost />
</div>
```

The overlay uses classes already in `src/index.css` (`.card`, `.btn`, `.choice`, `.learn-feedback`, `.win-banner`) plus `src/components/MonsterEncounter.css`. No change to `src/index.css` is required. Give the host a z-index above the world: the card is `position: fixed` at `z-index: 40`, which covers `.troy`.

## Dev preview

After the host is mounted, `npm run dev` and open `/?encounter=1` or `/?encounter=2`. The fight opens on load. Press on, Fall back, and Slip away each emit `ohmyssey:encounter-result` and start another fight. Close preview removes the overlay without a result event. The query is ignored in a production build, and it does nothing until `<EncounterHost />` is on the page.

## Props

`MonsterEncounter` can also be rendered by hand:

- `level` — `1` or `2`
- `onWin` — monster HP hit 0
- `onLose` — hero HP hit 0
- `onFlee` — Slip away, or Esc during the questions
- `monsterId` — optional id from `src/learn/encounters/monsters.js`
- `preview` — optional, shows the dev label and Close preview
