/**
 * Foes for the two playable stretches of the voyage.
 * Level 1 is the fall of Troy. Level 2 is the return to Ithaca.
 * hp is how many correct answers it takes to break them.
 * damage is how many of Odysseus's hearts a wrong answer costs.
 */

export const HERO = {
  name: 'Odysseus',
  hp: 3,
  strike: 1,
};

export const LEVEL_PLACES = {
  1: 'Fall of Troy',
  2: 'Return to Ithaca',
};

export const MONSTERS = [
  {
    id: 'trojan-shade',
    level: 1,
    name: 'Trojan Shade',
    hp: 3,
    damage: 1,
    flavor: 'A spearman who never left the gate. Bronze and ash, and he will not let a dark lamp pass.',
  },
  {
    id: 'harpy',
    level: 1,
    name: 'Harpy',
    hp: 2,
    damage: 1,
    flavor: 'She drops out of the night over the beach, wings clipping the wire you just strung.',
  },
  {
    id: 'gate-cinder',
    level: 1,
    name: 'Gate Cinder',
    hp: 3,
    damage: 1,
    flavor: 'Embers from the fallen city pull themselves into a face. They want the lamp left open.',
  },
  {
    id: 'cyclops-whelp',
    level: 2,
    name: 'Cyclops Whelp',
    hp: 3,
    damage: 1,
    flavor: 'One eye, not yet the giant\'s. It glares like an LED wired the wrong way around.',
  },
  {
    id: 'suitors-hound',
    level: 2,
    name: "Suitor's Hound",
    hp: 2,
    damage: 1,
    flavor: 'It guards the hall at Ithaca for men who do not belong there. The collar is a closed loop.',
  },
  {
    id: 'feasting-suitor',
    level: 2,
    name: 'Feasting Suitor',
    hp: 2,
    damage: 1,
    flavor: 'He still sits at Penelope\'s table, cup in hand, and will not yield the hall.',
  },
];

export function levelPlace(level) {
  return LEVEL_PLACES[Number(level)] || 'The voyage';
}

export function monstersForLevel(level) {
  const n = Number(level);
  return MONSTERS.filter((monster) => monster.level === n);
}

/**
 * monsterId locks a specific foe when it belongs to this level.
 * Otherwise a foe is drawn from that level's roster.
 */
export function pickMonster(level, monsterId, rng = Math.random) {
  const pool = monstersForLevel(level);
  if (pool.length === 0) return null;
  if (monsterId) {
    const found = pool.find((monster) => monster.id === monsterId);
    if (found) return found;
  }
  return pool[Math.floor(rng() * pool.length)];
}
