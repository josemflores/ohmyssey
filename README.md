# Ohmyssey

**Sail from Troy to Ithaca. The only way home is electronics.**

Ohmyssey is a browser game for hackUTA (Nov 14–15, 2026). You play Odysseus and learn electronics one island at a time. Each stop teaches one idea, then asks you to build a small circuit with real component values. Athena is a guide powered by Gemini. She looks at the parts you placed and nudges you toward the fix without handing you the answer. The last island is a 555 timer beacon, and the lighthouse of Ithaca blinks at the rate you calculated.

Someone who has never touched a resistor should be able to finish the first two islands in a few minutes and come away knowing what a closed loop is and how to size an LED resistor. The later islands are sketches the team fills in.

There is no account. Progress stays in `localStorage` in this browser. Later islands stay locked until the one before them is won.

**Live:** [ohmyssey.tech](https://ohmyssey.tech) · **Also attach:** [ohmyssey.study](https://ohmyssey.study) · **Demo video:** _link_ · **Devpost:** _link_

## The voyage

| # | Episode | Concept | You build | Status |
| --- | --- | --- | --- | --- |
| 1 | Leaving Troy | Voltage, current, a closed loop | The ship's lantern: battery, switch, resistor, and a red LED | Playable |
| 2 | The Cyclops | Ohm's law, V = I × R, and why an LED needs a resistor | A torch for the cave. Pick the resistor or the eye burns out. 9 V, a 2 V red LED, and 390 Ω give about 18 mA | Playable |
| 3 | The Sirens | Series vs parallel, equivalent resistance | Crew lanterns. In parallel, one going dark does not darken the rest | Sketch |
| 4 | Aeolus' bag of winds | Capacitors, RC time constant τ = R × C | A lamp whose timing follows the capacitor charging | Sketch |
| 5 | Charybdis | Inductors, flyback voltage, a diode | A coil protected by a flyback diode pointed the right way | Sketch |
| 6 | The lighthouse of Ithaca | 555 timer in astable mode | A blinking beacon between 0.5 and 2 Hz. The worked example is about 1 Hz | Sketch |

Each island in the app has a short story, lesson cards, and one circuit build. A quiz card is not in the starter yet. Add one as another field on the level object when you want it.

### The math under the hood

The game uses exact formulas instead of a full circuit simulator, so the feedback is instant. Levels 1 and 2 call these now. The later lines are the formulas the sketches in `src/levels/` are waiting on.

```
LED current:      I = (V_supply − V_LED) / R
                  red LED: V_LED = 2.0 V
                  under 5 mA is dim, 5–30 mA counts as lit, above 30 mA burns out
                  a comfortable design target is about 10–20 mA
Series:           R_eq = R1 + R2
Parallel:         R_eq = (R1 × R2) / (R1 + R2)
RC time constant: τ = R × C                 (about 63% charged at 1τ, about full at 5τ)
Cap charging:     V(t) = V × (1 − e^(−t / RC))
555 astable:      t_high = 0.693 × (R1 + R2) × C
                  t_low  = 0.693 × R2 × C
                  f      ≈ 1.44 / ((R1 + 2 × R2) × C)
```

Level 2 check: (9 V − 2 V) / 390 Ω = 17.9 mA, about 18 mA. The lighthouse example in `src/levels/level6.js` is R1 = 1 kΩ, R2 = 68 kΩ, C = 10 µF, about 1 Hz.

The same 555 values work on a real breadboard: a 555, a 9 V battery, those two resistors, a 10 µF capacitor, an LED, and a separate resistor to limit the LED current. It blinks at about 1 Hz, matching the game.

## Run it on your laptop

You need [Node.js](https://nodejs.org/) 18 or newer. From this folder, in PowerShell, Command Prompt, or a terminal:

```bash
git clone https://github.com/josemflores/ohmyssey.git
cd ohmyssey
npm install
npm run dev
```

Open http://localhost:5173.

`npm run dev` also serves `POST /api/athena`, so a key in `.env` is enough to hear Athena on your laptop. Copy `.env.example` to `.env` (or `.env.local`, which is also gitignored) and paste a key from [Google AI Studio](https://aistudio.google.com/apikey). Restart the dev server after you save the file. Never prefix the name with `VITE_`, and never commit the file.

```bash
npm test        # checks the Ohm's law numbers and the Athena helper
npm run build   # writes the site into dist/
npm run preview # serves dist/ locally. That preview has no API route, so hints fall back to the level notes
```

`npx vercel dev` is the other way to run the serverless function locally. Use it if you want the same Node handler Vercel runs in production.

## Deploy it on Vercel

The project is a Vite app plus one serverless function, `api/athena.js`. Vercel detects both. Pushes to `main` are the production deploys. Other branches get preview URLs.

1. Push the repository to GitHub.
2. In [Vercel](https://vercel.com), choose **Add New Project** and import the repository.
3. Leave the framework preset on **Vite**. The build command is `npm run build`. The output directory is `dist`.
4. Add an environment variable named `GEMINI_API_KEY` for Production and Preview. This is the same name as in `.env.example`. Do not commit the key.
5. Deploy.
6. Open the project, then **Settings → Domains**, and add `ohmyssey.tech` and `ohmyssey.study`. The registrar is GoDaddy.
7. Vercel prints the DNS records for each domain. At GoDaddy, add the records Vercel shows. They are usually an **A** record on the root and a **CNAME** for `www`. Use the values on that screen so they match this project.

`vercel.json` sends page paths to `index.html` and leaves `/api/...` for the Athena function.

## Athena

The **Ask Athena** button sends the level text and the parts in the slots to `POST /api/athena`. The function calls Google Gemini and asks for one short Socratic hint in character. She can see the board. The prompt tells her not to give the winning resistor value. The API key is read from `GEMINI_API_KEY` on the server. It is not shipped to the browser.

If the key is missing, or Gemini does not answer, the panel shows the next line from that level's `hints` array. The game stays playable either way.

A later pass can grade the hints the way the team planned: attempts 1–2 stay a nudge, attempt 3 may give the exact fix using only numbers the level already computed, and a slow call (about 8 seconds) falls back to the canned lines. The starter does not do that grading yet. Every click is one short hint, or a canned line.

The optional `GEMINI_MODEL` variable overrides the model. The default is `gemini-3.5-flash-lite`, set in `api/athenaLogic.js`.

## Add or edit a level

Levels are JavaScript objects, not a separate content tool. Story, lessons, hints, part values, and the win rule live in the object, so you can change an island without a new screen. The map, the locks, the lesson cards, and the board all read that object.

The commented copy to start from is `src/levels/levelTemplate.js`. Levels 1 and 2 are the working examples. Levels 3 to 6 are the same shape with placeholder text, and their `check()` functions never return a win, so the islands after them stay locked.

To add island 7:

1. Copy `src/levels/levelTemplate.js` to `src/levels/level7.js`.
2. Set `id` to `7`. Ids must be 1, 2, 3… with no gaps. Island N opens when island N−1 has been won.
3. Fill in the story, the lesson cards, the hints, and `map: { x, y }`. `x` and `y` are percentages across the sea.
4. Write `check(circuit)`. It must return `complete`, `currentMa`, `led` (`off`, `dim`, `lit`, or `burnt`), `headline`, `detail`, and `equation`.
5. Import the level in `src/levels/index.js` and add it to the end of the `levels` array.

`check` receives:

```js
{
  slots: [{ id, part }],   // part is null, or { type, ohms, closed, ... }
  supply: { volts },
  ledVf: 2,
}
```

JSON cannot hold the `check` function, so each level is a `.js` file. Every other field is plain data you can edit like a document.

The board is one series picture: a fixed battery on the left and three slots. It does not simulate arbitrary wiring. Each level decides what a correct set of parts means. `src/lib/ohm.js` has the series-LED helper the first two islands share (`I = (Vbattery − Vled) / R`). A later island can ignore that helper and use its own formula. Free-wiring can come later.

## Where things live

| Path | What it is |
| --- | --- |
| `src/components/TitleScreen.jsx` | Opening screen |
| `src/components/VoyageMap.jsx` | The six islands |
| `src/components/LevelScreen.jsx` | Story, lessons, board, win |
| `src/components/CircuitBuilder.jsx` | Palette and slots |
| `src/components/SchematicSymbols.jsx` | The small part drawings |
| `src/components/AthenaPanel.jsx` | The hint button |
| `src/lib/progress.js` | `localStorage` save and the lock rule |
| `src/lib/parts.js` | Battery, switch, resistor, LED, capacitor, inductor, diode, wire |
| `src/lib/ohm.js` | Series LED current, and the lit / dim / burnt bands |
| `src/levels/` | One file per island, plus `levelTemplate.js` |
| `api/athena.js` | The Vercel function. This file holds the call that uses the API key |
| `api/athenaLogic.js` | The Gemini prompt, shared with local dev |
| `vite.config.js` | Dev-only `/api/athena`, so the key never enters the client bundle |
| `AI_TEAM.md` | Log of how AI tools were used. The plan came from Jarvis (Grok Bot). This scaffold came from a Cursor cloud agent |

Built with Cursor, Claude Code, and Grok Bot (Jarvis).

## The numbers the first two islands use

A red LED in this game is held at a **2 V** forward voltage so the arithmetic stays on paper. Real LEDs move a little with color and current.

The resistor sees `9 V − 2 V = 7 V`.

| Resistor | Current | What the lamp does |
| --- | --- | --- |
| 100 Ω | 70 mA | Burnt out (above about 30 mA) |
| 220 Ω | 31.8 mA | Burnt out |
| 330 Ω | 21.2 mA | Lit. Level 1 accepts it. Level 2 wants 16 to 20 mA. |
| 390 Ω | 17.9 mA | About 18 mA. This wins the Cyclops. |
| 470 Ω | 14.9 mA | Lit, but dim for the cave |
| 1 kΩ | 7.0 mA | Lit on the beach, too dim for the cave |
| 10 kΩ | 0.7 mA | Dim (under about 5 mA) |

Level 1 is won by a closed switch, one resistor, one LED, and a current from 5 mA through 30 mA. Level 2 uses the same loop and asks for 16 to 20 mA. Order in the slots does not matter, because parts in one series loop share one current.

## Team

| Role | Name |
| --- | --- |
| Content and physics lead | _Person A_ |
| Frontend and game builder | _Person B_ |
| Integration and deploy | _Person C_ |
| Story, design, and demo | _Person D_ |

## What's next

- Graded Athena hints: a nudge twice, then the exact fix, with a timeout back to the canned lines
- A quiz question on each island
- Free-wiring mode
- More parts and islands: transistors, op-amps, Scylla
- A teacher mode for classrooms

## Prize tracks

- Best Use of Gemini API
- SpaceXSI: Cursor + Grok Bot A-team
- Best Domain from GoDaddy Registry

Made with care, and a little help from the gods, at hackUTA 2026.
