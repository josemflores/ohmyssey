// The lesson book: what the Lessons menu (L) teaches for each level of the
// demo. Keyed by study-pack id (1 = Troy, 6 = Ithaca, see TroyLearn.jsx).
// It covers what the game actually asks: Troy's gate and battles are about
// loops, Ohm's law, series and parallel, diodes and power; Ithaca's hall is
// about capacitors, inductors and time constants. The practice puzzle comes
// from the level pack (levels.json) and is unchanged.
//
// Shape:
//   background: { lead, sections: [{ title, paragraphs }] }
//   concepts:   [{ id, title, summary, paragraphs, equation?, where?, remember? }]
//   equations:  [{ name, equation, terms: [[symbol, meaning, unit]], example }]
//   examples:   [{ title, question, steps, answer }]

export const LESSON_BOOK = {
  1: {
    background: {
      lead: 'The Greeks named it first. Elektron is the ancient Greek word for amber, the golden resin that pulls bits of straw toward it once it is rubbed with wool.',
      sections: [
        {
          title: 'From amber to batteries',
          paragraphs: [
            'Around 600 BC, Thales of Miletus noticed that rubbed amber attracts light things. That pull is static electricity: charge that has piled up and has nowhere to go.',
            'It took more than two thousand years to make charge flow on purpose. In 1800 Alessandro Volta stacked discs of zinc and copper with salty cloth between them and built the first battery. For the first time, charge could stream steadily through a wire. That stream is an electric current.',
          ],
        },
        {
          title: 'The three ideas you need at Troy',
          paragraphs: [
            'Every question at the gate and in the battles uses three quantities. Voltage is the push. Current is the flow. Resistance is how hard the path fights back.',
            'A good picture is water in a pipe. The battery is a pump that raises the water (voltage). The water moving through the pipe is the current. A narrow section of pipe is a resistor: it slows the flow for the same push.',
          ],
        },
        {
          title: 'Why the LED needs care',
          paragraphs: [
            'An LED is a one-way valve that glows. It only lets current through in one direction, and it always takes about the same voltage for itself. Get the direction right and limit the current with a resistor, and it lights for years. Get it wrong and it stays dark, or burns out.',
          ],
        },
      ],
    },
    concepts: [
      {
        id: 'loop',
        title: 'Current and the closed loop',
        summary: 'Current only flows in a complete circle.',
        paragraphs: [
          'Current is the flow of electric charge. It leaves the positive terminal of the battery, passes through every part, and must come back to the negative terminal. That round trip is a closed loop, or closed circuit.',
          'Any gap stops the flow everywhere in the loop, not just at the gap. An open switch is a gap. An empty slot is a gap. A broken wire is a gap. With a gap, the current is 0.',
          'Current is measured in amperes (A). Small circuits use milliamps: 1 mA = 0.001 A.',
        ],
        remember: 'Open loop → no current. Closed loop → current can flow.',
      },
      {
        id: 'voltage',
        title: 'Voltage, the push',
        summary: 'Voltage is the push that drives current around the loop.',
        paragraphs: [
          'Voltage is the difference in electrical "pressure" between two points. A 9 V battery pushes harder than a 1.5 V cell. Voltage is measured in volts (V).',
          'Every part in a loop uses up some of the push. Going once around a loop, the voltages used by the parts add up to exactly the voltage of the battery. Nothing is left over and nothing is missing.',
        ],
        equation: 'V(battery) = V₁ + V₂ + V₃ + …',
        where: 'Around one loop, the drops add up to the source.',
        remember: 'The battery gives the push; the parts share it out.',
      },
      {
        id: 'ohm',
        title: "Resistance and Ohm's law",
        summary: 'Voltage = current × resistance.',
        paragraphs: [
          'Resistance is how strongly a part opposes current. It is measured in ohms (Ω). 1 kΩ = 1,000 Ω.',
          "In 1827 Georg Ohm found that, for a resistor, the current rises in step with the voltage. Double the push, double the flow. This is Ohm's law, and it is the most used equation in the whole game.",
          'Rearrange it to find whatever is missing: I = V ÷ R, or R = V ÷ I.',
        ],
        equation: 'V = I × R',
        where: 'V in volts, I in amps, R in ohms.',
        remember: 'Volts ÷ kilohms gives milliamps: 9 V ÷ 3 kΩ = 3 mA.',
      },
      {
        id: 'series',
        title: 'Resistors in series',
        summary: 'One path: the resistances add.',
        paragraphs: [
          'Parts in series sit one after another on a single path. The same current flows through each of them, because it has nowhere else to go.',
          'The total resistance is the sum. More resistors in a row make the path harder, so less current flows.',
          'The battery voltage is shared between them in proportion to their resistance: the bigger resistor takes the bigger share.',
        ],
        equation: 'R(total) = R₁ + R₂ + R₃ + …',
        where: 'Same current through every part.',
        remember: '1 kΩ + 2 kΩ in series = 3 kΩ.',
      },
      {
        id: 'parallel',
        title: 'Resistors in parallel',
        summary: 'Side by side: the total is smaller than either.',
        paragraphs: [
          'Parts in parallel sit on separate branches between the same two points. Each branch gets the full voltage, and the currents in the branches add up.',
          'Adding a branch gives the current another road, so the total resistance goes down. It is always smaller than the smallest branch.',
          'For two resistors there is a shortcut: product over sum. Two equal resistors in parallel give exactly half of one.',
        ],
        equation: '1 / R(total) = 1 / R₁ + 1 / R₂',
        where: 'For two: R = (R₁ × R₂) ÷ (R₁ + R₂).',
        remember: 'Two 4 kΩ in parallel = 2 kΩ.',
      },
      {
        id: 'diode',
        title: 'Diodes and LEDs',
        summary: 'One-way parts that keep a fixed voltage for themselves.',
        paragraphs: [
          'A diode lets current through in only one direction: into the anode (the wide side of the triangle) and out of the cathode (the bar). Turned the other way, it blocks, like an open switch.',
          'When it conducts, a diode keeps a nearly fixed voltage, called the forward drop: about 0.7 V for a silicon diode and about 2 V for a red LED. The rest of the battery voltage goes to the resistor.',
          'That is why an LED needs a resistor in series: the resistor sets the current. Without it, the current would be far too large.',
        ],
        equation: 'I = (V(battery) − V(drop)) ÷ R',
        where: 'Red LED drop ≈ 2 V. Silicon diode ≈ 0.7 V.',
        remember: '9 V, red LED, 1 kΩ: I = (9 − 2) ÷ 1 kΩ = 7 mA.',
      },
      {
        id: 'power',
        title: 'Power',
        summary: 'How fast energy is used: P = V × I.',
        paragraphs: [
          'Power is how quickly a part turns electrical energy into light, heat or motion. It is measured in watts (W). 1 mW = 0.001 W.',
          "Combine it with Ohm's law to get two more forms. Use whichever matches the numbers you have.",
        ],
        equation: 'P = V × I = I² × R = V² ÷ R',
        where: 'P in watts, V in volts, I in amps, R in ohms.',
        remember: '9 V at 3 mA: P = 9 × 0.003 = 0.027 W = 27 mW.',
      },
    ],
    equations: [
      {
        name: "Ohm's law",
        equation: 'V = I × R',
        terms: [['V', 'voltage', 'volts (V)'], ['I', 'current', 'amps (A)'], ['R', 'resistance', 'ohms (Ω)']],
        example: '6 V across 2 kΩ → I = 6 ÷ 2000 = 3 mA',
      },
      {
        name: 'Series resistance',
        equation: 'R = R₁ + R₂ + …',
        terms: [['R', 'total resistance', 'Ω'], ['R₁, R₂', 'each resistor', 'Ω']],
        example: '1 kΩ + 2 kΩ = 3 kΩ',
      },
      {
        name: 'Parallel resistance',
        equation: '1/R = 1/R₁ + 1/R₂',
        terms: [['R', 'total resistance', 'Ω'], ['R₁, R₂', 'each branch', 'Ω']],
        example: '4 kΩ ∥ 4 kΩ = 2 kΩ',
      },
      {
        name: 'Current with a diode or LED',
        equation: 'I = (V − V_f) ÷ R',
        terms: [['V', 'battery voltage', 'V'], ['V_f', 'forward drop (0.7 V or ≈2 V)', 'V'], ['R', 'series resistor', 'Ω']],
        example: '(9 − 2) V ÷ 1 kΩ = 7 mA',
      },
      {
        name: 'Power',
        equation: 'P = V × I',
        terms: [['P', 'power', 'watts (W)'], ['V', 'voltage', 'V'], ['I', 'current', 'A']],
        example: '9 V × 3 mA = 27 mW',
      },
      {
        name: 'Unit prefixes',
        equation: 'k = 10³ · m = 10⁻³ · µ = 10⁻⁶',
        terms: [['k', 'kilo, a thousand', '1 kΩ = 1000 Ω'], ['m', 'milli, a thousandth', '1 mA = 0.001 A'], ['µ', 'micro, a millionth', '1 µF = 0.000001 F']],
        example: 'Volts ÷ kilohms = milliamps',
      },
    ],
    examples: [
      {
        title: 'One resistor',
        question: 'A 9 V battery drives a single 3 kΩ resistor. What is the current?',
        steps: ['The loop is closed and there is one resistor, so use I = V ÷ R.', 'I = 9 V ÷ 3 kΩ.', 'Volts over kilohms gives milliamps.'],
        answer: 'I = 3 mA',
      },
      {
        title: 'Two in series',
        question: 'A 12 V battery drives 1 kΩ and 3 kΩ in series. Find the current and the voltage across the 3 kΩ.',
        steps: ['Series resistances add: R = 1 kΩ + 3 kΩ = 4 kΩ.', 'I = 12 V ÷ 4 kΩ = 3 mA, the same through both.', 'V across 3 kΩ = I × R = 3 mA × 3 kΩ = 9 V. (The 1 kΩ takes the other 3 V.)'],
        answer: 'I = 3 mA, V = 9 V',
      },
      {
        title: 'Two in parallel',
        question: 'A 6 V battery feeds two 6 kΩ resistors in parallel. What current leaves the battery?',
        steps: ['Two equal resistors in parallel give half of one: R = 3 kΩ.', 'I = 6 V ÷ 3 kΩ = 2 mA.', 'Check: each branch gets the full 6 V, so 1 mA each, and 1 + 1 = 2 mA.'],
        answer: 'I = 2 mA',
      },
      {
        title: 'An LED and its resistor',
        question: 'A 9 V battery, a 1 kΩ resistor and a red LED (2 V drop) are in series, LED the right way round. Find the current.',
        steps: ['The LED keeps about 2 V for itself.', 'That leaves 9 − 2 = 7 V for the resistor.', 'I = 7 V ÷ 1 kΩ = 7 mA. (If the LED were backwards, I would be 0.)'],
        answer: 'I = 7 mA',
      },
    ],
  },

  6: {
    background: {
      lead: 'Home is Ithaca, and the parts that matter here are the ones that store energy: the capacitor and the inductor. They do not just resist current. They remember.',
      sections: [
        {
          title: 'A jar that held lightning',
          paragraphs: [
            'In 1745, experimenters in Leiden lined a glass jar with metal foil inside and out and charged it. Touching it gave a shock long after the charging stopped. The Leyden jar was the first capacitor: two conductors separated by an insulator, holding charge until it is let go.',
            'The unit of capacitance, the farad, honours Michael Faraday. One farad is enormous, so real capacitors are measured in microfarads (µF).',
          ],
        },
        {
          title: 'A coil that fights change',
          paragraphs: [
            'In the 1830s, Faraday in England and Joseph Henry in America found that a coil of wire builds a magnetic field when current flows, and that the field pushes back whenever the current tries to change. That coil is an inductor, and its unit is the henry (H).',
          ],
        },
        {
          title: 'Why timing matters in the hall',
          paragraphs: [
            'Resistors react instantly. Capacitors and inductors take time. That is why the questions in the hall ask "just after switch-on" or "long after switch-on". At the first instant and after a long wait, these parts behave in simple, opposite ways, and between the two moments the change is set by the time constant, τ.',
            'The lighthouse puzzle in Practice uses the same idea: a 555 timer charges and discharges a capacitor over and over, so the beacon blinks on its own.',
          ],
        },
      ],
    },
    concepts: [
      {
        id: 'capacitor',
        title: 'The capacitor',
        summary: 'Two plates, a gap, and stored charge.',
        paragraphs: [
          'A capacitor is two conducting plates with an insulator between them. Charge cannot cross the gap. Instead, the battery piles positive charge on one plate and negative charge on the other.',
          'The energy sits in the electric field across the gap. The bigger the capacitance C, the more charge it holds for each volt.',
        ],
        equation: 'Q = C × V',
        where: 'Q in coulombs, C in farads, V in volts.',
        remember: '10 µF charged to 5 V holds 50 µC.',
      },
      {
        id: 'cap-time',
        title: 'Capacitors over time',
        summary: 'Empty: like a wire. Full: like a gap.',
        paragraphs: [
          'Just after switch-on, an empty capacitor takes charge easily, so for that instant it acts like a plain wire. All the battery voltage sits across the resistor.',
          'As it fills, the current falls. Long after switch-on it is full: no more current flows in a DC circuit, and it acts like a gap (an open switch). Now it holds the whole battery voltage.',
          'How fast this happens is set by the time constant τ = R × C. After one τ the capacitor is about 63% charged. After about 5τ it is effectively full (99%).',
        ],
        equation: 'τ = R × C',
        where: 'R in ohms, C in farads, τ in seconds.',
        remember: '10 kΩ × 100 µF = 10,000 × 0.0001 = 1 s.',
      },
      {
        id: 'cap-energy',
        title: 'Energy in a capacitor',
        summary: 'E = ½ C V².',
        paragraphs: [
          'A charged capacitor stores energy, like a stretched spring. The energy grows with the square of the voltage: double the voltage, four times the energy.',
          'That is how a camera flash works: a battery slowly charges a capacitor, then the capacitor dumps all its energy into the bulb in a fraction of a second.',
        ],
        equation: 'E = ½ × C × V²',
        where: 'E in joules, C in farads, V in volts.',
        remember: '100 µF at 10 V: ½ × 0.0001 × 100 = 5 mJ.',
      },
      {
        id: 'cap-combine',
        title: 'Combining capacitors',
        summary: 'The opposite of resistors.',
        paragraphs: [
          'In parallel, capacitors add, because it is like making the plates bigger.',
          'In series, the total is smaller than either, because it is like widening the gap. Two equal capacitors in series give half of one.',
          'This is exactly backwards from resistors, which add in series and shrink in parallel.',
        ],
        equation: 'Parallel: C = C₁ + C₂     Series: 1/C = 1/C₁ + 1/C₂',
        where: 'Inductors combine like resistors: they add in series.',
        remember: 'Two 10 µF: 20 µF in parallel, 5 µF in series.',
      },
      {
        id: 'inductor',
        title: 'The inductor',
        summary: 'A coil that resists changes in current.',
        paragraphs: [
          'An inductor is a coil of wire. Current through it builds a magnetic field, and the field stores energy.',
          'Whenever the current tries to change, the field pushes back with a voltage of its own. The faster the change, the bigger the push. A steady current, though, passes as if through a plain wire.',
        ],
        equation: 'V = L × (change in I ÷ change in t)',
        where: 'L in henries. Steady current → no voltage.',
        remember: 'An inductor resists changes in current, not current itself.',
      },
      {
        id: 'ind-time',
        title: 'Inductors over time',
        summary: 'At first: no current. Later: like a wire.',
        paragraphs: [
          'Just after switch-on, the inductor fights the sudden change, so the current starts at 0. It is the opposite of an empty capacitor.',
          'The current then rises. Long after switch-on it is steady, the inductor acts like a wire, and I = V ÷ R. The time constant for a coil is τ = L ÷ R.',
          'If the switch is opened suddenly, the coil tries to keep its current going and makes a big voltage spike. A diode placed across the coil (a flyback diode) gives that current a safe loop.',
        ],
        equation: 'τ = L ÷ R     E = ½ × L × I²',
        where: 'L in henries, R in ohms, I in amps.',
        remember: '100 mH ÷ 10 Ω = 0.01 s = 10 ms.',
      },
      {
        id: 'beacon',
        title: 'The 555 beacon',
        summary: 'A capacitor that charges and discharges forever.',
        paragraphs: [
          'The lighthouse in Practice uses a 555 timer chip. It charges a capacitor through R1 and R2, then empties it through R2, over and over. The light is on while the capacitor charges and off while it discharges.',
          'Bigger resistors or a bigger capacitor mean a longer time constant, so a slower blink. R2 counts twice because it is in both halves of the cycle.',
        ],
        equation: 'f = 1.44 ÷ ((R1 + 2 R2) × C)',
        where: 'f in hertz (blinks per second).',
        remember: 'R1 = 1 kΩ, R2 = 68 kΩ, C = 10 µF → about 1 Hz.',
      },
    ],
    equations: [
      {
        name: 'Charge on a capacitor',
        equation: 'Q = C × V',
        terms: [['Q', 'charge', 'coulombs (C)'], ['C', 'capacitance', 'farads (F)'], ['V', 'voltage', 'V']],
        example: '10 µF × 5 V = 50 µC',
      },
      {
        name: 'RC time constant',
        equation: 'τ = R × C',
        terms: [['τ', 'time constant', 'seconds (s)'], ['R', 'resistance', 'Ω'], ['C', 'capacitance', 'F']],
        example: '2 kΩ × 500 µF = 1 s',
      },
      {
        name: 'RL time constant',
        equation: 'τ = L ÷ R',
        terms: [['τ', 'time constant', 's'], ['L', 'inductance', 'henries (H)'], ['R', 'resistance', 'Ω']],
        example: '100 mH ÷ 10 Ω = 10 ms',
      },
      {
        name: 'Energy stored',
        equation: 'E = ½CV²   ·   E = ½LI²',
        terms: [['E', 'energy', 'joules (J)'], ['C, V', 'capacitance, voltage', 'F, V'], ['L, I', 'inductance, current', 'H, A']],
        example: '2 H at 1 A → ½ × 2 × 1² = 1 J',
      },
      {
        name: 'Combining',
        equation: 'C∥ = C₁ + C₂   ·   L(series) = L₁ + L₂',
        terms: [['C∥', 'capacitors in parallel', 'F'], ['1/C(series)', '= 1/C₁ + 1/C₂', 'F'], ['L(series)', 'inductors in series', 'H']],
        example: '10 µF + 22 µF + 68 µF in parallel = 100 µF',
      },
      {
        name: 'Charging milestones',
        equation: '1τ ≈ 63%   ·   5τ ≈ 99%',
        terms: [['Start', 'C: like a wire · L: no current', ''], ['Settled', 'C: like a gap · L: like a wire', ''], ['τ', 'sets the pace in between', 's']],
        example: 'τ = 1 s → nearly full after about 5 s',
      },
    ],
    examples: [
      {
        title: 'The first instant',
        question: 'A 9 V battery, a 1 kΩ resistor and an empty 100 µF capacitor are in series. What current flows just after switch-on?',
        steps: ['An empty capacitor acts like a wire at the first instant.', 'So only the resistor limits the current.', 'I = 9 V ÷ 1 kΩ.'],
        answer: 'I = 9 mA (and it falls to 0 as the capacitor fills)',
      },
      {
        title: 'Long after',
        question: 'A 12 V battery, a 2 kΩ resistor and a 10 mH inductor are in series. What current flows long after switch-on?',
        steps: ['Once the current is steady, the inductor acts like a plain wire.', 'Only the resistor is left: I = 12 V ÷ 2 kΩ.', 'At the very first instant it would have been 0.'],
        answer: 'I = 6 mA',
      },
      {
        title: 'How long to charge',
        question: 'A 10 kΩ resistor charges a 100 µF capacitor. What is τ, and about how long until it is full?',
        steps: ['Turn µF into farads: 100 µF = 0.0001 F.', 'τ = R × C = 10,000 × 0.0001 = 1 s.', 'Nearly full after about 5τ.'],
        answer: 'τ = 1 s, full after about 5 s',
      },
      {
        title: 'Energy stored',
        question: 'A 100 µF capacitor is charged to 10 V. How much energy does it hold?',
        steps: ['E = ½ × C × V².', 'E = ½ × 0.0001 F × (10 V)² = ½ × 0.0001 × 100.', '= 0.005 J.'],
        answer: 'E = 5 mJ',
      },
    ],
  },
};

export function lessonBookFor(levelId) {
  return LESSON_BOOK[levelId] || null;
}
