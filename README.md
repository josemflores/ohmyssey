# Ohmyssey

A hackUTA 2026 game. Odysseus leaves Troy knowing nothing about electronics. Six islands take him home to Ithaca:

1. **Leaving Troy** — a closed loop: battery, switch, resistor, LED. Playable.
2. **The Cyclops** — Ohm’s law. A 9 V battery, a red LED that holds about 2 V, and 390 Ω give about 18 mA. Playable.
3. **The Sirens** — series and parallel. Sketch.
4. **Aeolus’ bag** — capacitors and RC timing. Sketch.
5. **Charybdis** — an inductor and a flyback diode. Sketch.
6. **The lighthouse of Ithaca** — a 555 astable blinker, about 0.5 to 2 Hz. Sketch. The worked example waiting in `src/levels/level6.js` is R1 = 1 kΩ, R2 = 68 kΩ, C = 10 µF, about 1 Hz.

There is no account. Progress is saved in `localStorage` in the browser. Later islands stay locked until the one before them is won.

## Run it on your laptop

You need [Node.js](https://nodejs.org/) 18 or newer. From this folder, in PowerShell, Command Prompt, or a terminal:

```bash
npm install
npm run dev
```

Open http://localhost:5173.

Other commands:

```bash
npm test        # checks the Ohm's law numbers and the Athena helper
npm run build   # writes the site into dist/
npm run preview # serves dist/ locally. Athena is not included; hints fall back to the level notes
```

## Deploy it on Vercel, on ohmyssey.study

The project is a Vite app plus one serverless function, `api/athena.js`. Vercel detects both.

1. Push the repository to GitHub.
2. In [Vercel](https://vercel.com), choose **Add New Project** and import the repository.
3. Leave the framework preset on **Vite**. The build command is `npm run build`. The output directory is `dist`.
4. Add an environment variable named `GEMINI_API_KEY` for Production. This is the same name as in `.env.example`. Do not commit the key.
5. Deploy.
6. Open the project, then **Settings → Domains**, and add `ohmyssey.study`.
7. Vercel prints the DNS records for that domain. At the registrar that owns `ohmyssey.study`, add the records Vercel shows. They are usually an **A** record on the root and a **CNAME** for `www`. Use the values on that screen so they match this project. When the domain status turns valid, the game is on https://ohmyssey.study.

`vercel.json` sends page paths to `index.html` and leaves `/api/...` for the Athena function.

## Athena

The **Ask Athena** button sends the level text and the parts in the slots to `POST /api/athena`. The function calls Google Gemini and asks for a short hint in character. The API key is read from `GEMINI_API_KEY` on the server. It is not shipped to the browser. Do not rename it to `VITE_GEMINI_API_KEY`.

If the key is missing, or Gemini does not answer, the panel shows the next line from that level’s `hints` array. The game stays playable either way.

To try a live hint on your laptop:

1. Copy `.env.example` to `.env`.
2. Paste a key from [Google AI Studio](https://aistudio.google.com/apikey).
3. Restart `npm run dev`.

The optional `GEMINI_MODEL` variable overrides the model. The default is `gemini-3.5-flash-lite`, set in `api/athenaLogic.js`.

## Add or edit a level

Levels are JavaScript objects, not a separate content tool. A new island does not need a new screen. The map, the locks, the lesson cards, and the board all read the object.

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

JSON cannot hold the `check` function, so each level is a `.js` file. Every other field is plain data.

The board is one series picture: a fixed battery on the left and three slots. It does not simulate arbitrary wiring. Each level decides what a correct set of parts means. `src/lib/ohm.js` has the series-LED helper the first two islands share (`I = (Vbattery − Vled) / R`). A later island can ignore that helper and use its own formula.

## Where things live

| Path | What it is |
| --- | --- |
| `src/components/TitleScreen.jsx` | Opening screen |
| `src/components/VoyageMap.jsx` | The six islands |
| `src/components/LevelScreen.jsx` | Story, lessons, board, win |
| `src/components/CircuitBuilder.jsx` | Palette and slots |
| `src/components/AthenaPanel.jsx` | The hint button |
| `src/lib/progress.js` | `localStorage` save and the lock rule |
| `src/lib/parts.js` | Battery, switch, resistor, LED, capacitor, inductor, diode, wire |
| `src/levels/` | One file per island |
| `api/athena.js` | The Vercel function |
| `api/athenaLogic.js` | The Gemini prompt, shared with local dev |
| `vite.config.js` | Dev-only `/api/athena`, so the key never enters the client bundle |

## The numbers the first two islands use

A red LED in this game is held at a **2 V** forward voltage so the arithmetic stays on paper. Real LEDs move a little with color and current.

The resistor sees `9 V − 2 V = 7 V`.

| Resistor | Current | What the lamp does |
| --- | --- | --- |
| 100 Ω | 70 mA | Burnt out (above about 30 mA) |
| 220 Ω | 31.8 mA | Burnt out |
| 330 Ω | 21.2 mA | Lit. Level 1 accepts it. Level 2 wants a tighter band. |
| 390 Ω | 17.9 mA | About 18 mA. This wins the Cyclops (16 to 20 mA). |
| 470 Ω | 14.9 mA | Lit, but dim for the cave |
| 1 kΩ | 7.0 mA | Lit on the beach, too dim for the cave |
| 10 kΩ | 0.7 mA | Dim (under about 5 mA) |

Level 1 is won by a closed switch, one resistor, one LED, and a current from 5 mA through 30 mA. Level 2 uses the same loop and asks for 16 to 20 mA. Order in the slots does not matter, because parts in one series loop share one current.
