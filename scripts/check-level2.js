// Checks that Level 2 (Ithaca) is walkable: the spawn is clear and every
// "Press E" spot can be reached by a feet-sized box. Run: node scripts/check-level2.js
import { hallLayoutReport } from '../src/game/level2/hallMap.js';
import {
  COLS, ROWS, SPAWN, SPOTS, buildLevel2Map, level2LayoutReport, reachableField, allSolids,
} from '../src/game/level2/map.js';

const grid = buildLevel2Map();
if (grid.length !== ROWS || grid.some((row) => row.length !== COLS)) {
  console.error('Level 2 grid has the wrong size.');
  process.exit(1);
}
const report = level2LayoutReport();
const field = reachableField(allSolids());
const area = field.seen.reduce((n, v) => n + v, 0);
console.log(`Level 2: ${COLS}×${ROWS} tiles, spawn (${SPAWN.x}, ${SPAWN.y}), ${SPOTS.length} spots, ${area} reachable 4px cells.`);
if (!report.ok) {
  console.error(report.problems.join('\n'));
  process.exit(1);
}
const hallReport = hallLayoutReport();
if (!hallReport.ok) {
  console.error(hallReport.problems.join('\n'));
  process.exit(1);
}
console.log(`Level 2 layout OK. The hall: every spot reachable (${hallReport.reachable} cells).`);
