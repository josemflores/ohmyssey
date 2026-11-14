/**
 * Every part the palette can place.
 *
 * To add a part later:
 *   1. Add an entry here.
 *   2. Add its drawing in src/components/SchematicSymbols.jsx.
 *   3. Teach a level's check() what the part means.
 * The palette lists PART_ORDER on every island so players can try the wrong part.
 */

export const PART_ORDER = [
  'battery',
  'switch',
  'resistor',
  'led',
  'capacitor',
  'inductor',
  'diode',
  'wire',
];

export const PARTS = {
  battery: {
    type: 'battery',
    label: 'Battery',
    blurb: 'A 9 V cell. The ship already has one fixed on the left of the schematic.',
  },
  switch: {
    type: 'switch',
    label: 'Switch',
    blurb: 'Opens or closes the only path. Click it after you place it.',
  },
  resistor: {
    type: 'resistor',
    label: 'Resistor',
    blurb: 'Limits current. Pick a value in ohms after you place it.',
  },
  led: {
    type: 'led',
    label: 'LED',
    blurb: 'A red lamp. In this game it holds about 2 V for itself.',
  },
  capacitor: {
    type: 'capacitor',
    label: 'Capacitor',
    blurb: 'Stores charge. Aeolus’s island will use one. It does not light this lamp.',
  },
  inductor: {
    type: 'inductor',
    label: 'Inductor',
    blurb: 'A coil. Charybdis will use one. It is not part of the beach lamp.',
  },
  diode: {
    type: 'diode',
    label: 'Diode',
    blurb: 'Lets current through one way. The LED is a special diode that lights.',
  },
  wire: {
    type: 'wire',
    label: 'Wire',
    blurb: 'A plain conductor. It closes a gap, but it does not limit current.',
  },
};

export function makePart(type, level) {
  if (!PARTS[type]) return null;
  if (type === 'resistor') {
    const ohms = level.defaultOhms ?? level.resistorValues?.[0] ?? 1000;
    return { type, ohms };
  }
  if (type === 'switch') return { type, closed: false };
  if (type === 'battery') return { type, volts: 9 };
  if (type === 'capacitor') return { type, microfarads: 10 };
  if (type === 'inductor') return { type, millihenries: 10 };
  return { type };
}

export function describePart(part) {
  if (!part) return 'empty';
  if (part.type === 'resistor') return `resistor ${part.ohms} ohm`;
  if (part.type === 'switch') return part.closed ? 'switch closed' : 'switch open';
  if (part.type === 'battery') return `battery ${part.volts} V`;
  if (part.type === 'capacitor') return `capacitor ${part.microfarads} µF`;
  if (part.type === 'inductor') return `inductor ${part.millihenries} mH`;
  return part.type;
}

/** A short description of the board, sent to Athena. No secrets live here. */
export function summarizeCircuit(level, slots) {
  return {
    supplyVolts: level.supply.volts,
    ledForwardVolts: level.led.vf,
    slots: slots.map((slot) => ({
      id: slot.id,
      hint: level.slots.find((item) => item.id === slot.id)?.hint || slot.id,
      part: describePart(slot.part),
    })),
  };
}
