import { computed, Injectable, signal } from '@angular/core';

import type { ChampionDetail } from '@/features/build-calculator/models/champion.model';
import type { Item } from '@/features/build-calculator/models/item.model';
import type { FinalStats } from '@/features/build-calculator/models/computed-stats.model';
import { calculateBaseStats, combineStats, sumItemStats } from '@/shared/utils/stats-calculator';

@Injectable({ providedIn: 'root' })
export class BuildCalculatorService {
  readonly selectedChampion = signal<ChampionDetail | null>(null);
  readonly selectedLevel = signal<number>(1);
  readonly selectedItems = signal<(Item | null)[]>([null, null, null, null, null, null]);
  readonly activeSlotIndex = signal<number | null>(null);

  readonly baseStats = computed(() => {
    const champion = this.selectedChampion();
    const level = this.selectedLevel();
    if (!champion) return null;
    return calculateBaseStats(champion.stats, level);
  });

  readonly itemBonuses = computed(() => {
    const items = this.selectedItems().filter((i): i is Item => i !== null);
    return sumItemStats(items);
  });

  readonly finalStats = computed((): FinalStats | null => {
    const base = this.baseStats();
    if (!base) return null;
    const bonuses = this.itemBonuses();
    return combineStats(base, bonuses);
  });

  selectChampion(champion: ChampionDetail): void {
    this.selectedChampion.set(champion);
  }

  setLevel(level: number): void {
    this.selectedLevel.set(Math.max(1, Math.min(18, level)));
  }

  setItemInSlot(index: number, item: Item): void {
    this.selectedItems.update(items => {
      const next = [...items];
      next[index] = item;
      return next;
    });
    this.activeSlotIndex.set(null);
  }

  clearItemInSlot(index: number): void {
    this.selectedItems.update(items => {
      const next = [...items];
      next[index] = null;
      return next;
    });
  }

  openItemPicker(index: number): void {
    this.activeSlotIndex.set(index);
  }

  closeItemPicker(): void {
    this.activeSlotIndex.set(null);
  }

  clearBuild(): void {
    this.selectedChampion.set(null);
    this.selectedLevel.set(1);
    this.selectedItems.set([null, null, null, null, null, null]);
    this.activeSlotIndex.set(null);
  }
}
