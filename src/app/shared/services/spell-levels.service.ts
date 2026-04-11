import { Injectable, signal } from '@angular/core';

const SPELL_MAX_RANKS: [number, number, number, number] = [5, 5, 5, 3];
const DEFAULT_LEVELS: [number, number, number, number] = [1, 1, 1, 1];

@Injectable({ providedIn: 'root' })
export class SpellLevelsService {
  /**
   * Spell levels keyed by champion id.
   * Each entry is [Q, W, E, R] rank (1-based).
   */
  private readonly _levels = signal<Record<string, [number, number, number, number]>>({});

  getLevels(championId: string): [number, number, number, number] {
    return this._levels()[championId] ?? DEFAULT_LEVELS;
  }

  increase(championId: string, index: number): void {
    const max = SPELL_MAX_RANKS[index];
    this._levels.update(map => {
      const current = map[championId] ?? [...DEFAULT_LEVELS] as [number, number, number, number];
      if (current[index] >= max) return map;
      const next = [...current] as [number, number, number, number];
      next[index] = Math.min(max, current[index] + 1);
      return { ...map, [championId]: next };
    });
  }

  decrease(championId: string, index: number): void {
    this._levels.update(map => {
      const current = map[championId] ?? [...DEFAULT_LEVELS] as [number, number, number, number];
      if (current[index] <= 1) return map;
      const next = [...current] as [number, number, number, number];
      next[index] = Math.max(1, current[index] - 1);
      return { ...map, [championId]: next };
    });
  }
}
