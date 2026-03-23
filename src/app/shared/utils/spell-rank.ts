/**
 * Standard leveling order: Q > E > W, R whenever available (levels 6, 11, 16).
 * Each tuple is [Q rank, W rank, E rank, R rank] at champion levels 1–18.
 */
const SPELL_RANKS_BY_LEVEL: readonly [number, number, number, number][] = [
  [1, 0, 0, 0], // 1
  [1, 1, 0, 0], // 2
  [1, 1, 1, 0], // 3
  [2, 1, 1, 0], // 4
  [3, 1, 1, 0], // 5
  [3, 1, 1, 1], // 6
  [4, 1, 1, 1], // 7
  [4, 1, 2, 1], // 8
  [5, 1, 2, 1], // 9
  [5, 1, 3, 1], // 10
  [5, 1, 3, 2], // 11
  [5, 1, 4, 2], // 12
  [5, 1, 5, 2], // 13
  [5, 2, 5, 2], // 14
  [5, 3, 5, 2], // 15
  [5, 3, 5, 3], // 16
  [5, 4, 5, 3], // 17
  [5, 5, 5, 3], // 18
];

/** Returns [Q rank, W rank, E rank, R rank] for a given champion level (1–18). */
export function getSpellRanks(championLevel: number): [number, number, number, number] {
  const lvl = Math.max(1, Math.min(18, championLevel));
  return [...SPELL_RANKS_BY_LEVEL[lvl - 1]] as [number, number, number, number];
}
