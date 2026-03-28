import { computed, Injectable, signal } from '@angular/core';

import type { ChampionDetail } from '@/features/build-calculator/models/champion.model';
import type { Item } from '@/features/build-calculator/models/item.model';
import type { FinalStats, ItemBonuses } from '@/features/build-calculator/models/computed-stats.model';
import type { DamageStats } from '@/shared/utils/damage-calculator';
import type { SavedBuild } from '@/features/build-calculator/models/build.model';
import { calculateBaseStats, combineStats, sumItemStats, sumConditionalBonuses } from '@/shared/utils/stats-calculator';
import { calculateDamageStats } from '@/shared/utils/damage-calculator';
import { getSpellRanks } from '@/shared/utils/spell-rank';

@Injectable({ providedIn: 'root' })
export class BuildCalculatorService {
  readonly selectedChampion = signal<ChampionDetail | null>(null);
  readonly selectedLevel = signal<number>(1);
  readonly selectedItems = signal<(Item | null)[]>([null, null, null, null, null, null]);
  readonly activeSlotIndex = signal<number | null>(null);

  /**
   * Toggles map keyed by `${itemId}_active` or `${itemId}_conditional`.
   * Active items default to true (enabled). Conditional items default to false (disabled).
   */
  readonly itemToggles = signal<Map<string, boolean>>(new Map());

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
    const items = this.selectedItems().filter((i): i is Item => i !== null);
    const toggles = this.itemToggles();

    const conditional = sumConditionalBonuses(items, toggles);
    const combined: ItemBonuses = {
      hp: bonuses.hp + (conditional.hp ?? 0),
      mp: bonuses.mp,
      armor: bonuses.armor + (conditional.armor ?? 0),
      magicResist: bonuses.magicResist + (conditional.magicResist ?? 0),
      attackDamage: bonuses.attackDamage + (conditional.attackDamage ?? 0),
      abilityPower: bonuses.abilityPower + (conditional.abilityPower ?? 0),
      movementSpeed: bonuses.movementSpeed,
      critChance: bonuses.critChance + (conditional.critChance ?? 0),
      attackSpeedBonus: bonuses.attackSpeedBonus + (conditional.attackSpeedBonus ?? 0),
    };

    return combineStats(base, combined);
  });

  readonly damageStats = computed((): DamageStats | null => {
    const champion = this.selectedChampion();
    const final = this.finalStats();
    const base = this.baseStats();
    if (!champion || !final || !base || !champion.spells?.length) return null;
    const ranks = getSpellRanks(this.selectedLevel());
    return calculateDamageStats(
      champion.spells,
      ranks,
      final,
      base,
      this.selectedItems(),
      this.itemToggles(),
    );
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

  applyItems(items: (Item | null)[]): void {
    this.selectedItems.set([...items]);
    this.activeSlotIndex.set(null);
  }

  prefillFromBuild(build: SavedBuild): void {
    this.selectedChampion.set(build.champion ?? null);
    this.selectedLevel.set(build.level);
    this.selectedItems.set([...build.items]);
    this.activeSlotIndex.set(null);
    if (build.itemToggles) {
      this.itemToggles.set(new Map(Object.entries(build.itemToggles)));
    } else {
      this.itemToggles.set(new Map());
    }
  }

  clearItems(): void {
    this.selectedItems.set([null, null, null, null, null, null]);
    this.activeSlotIndex.set(null);
    this.itemToggles.set(new Map());
  }

  clearBuild(): void {
    this.selectedChampion.set(null);
    this.selectedLevel.set(1);
    this.selectedItems.set([null, null, null, null, null, null]);
    this.activeSlotIndex.set(null);
    this.itemToggles.set(new Map());
  }

  getActiveToggle(itemId: string): boolean {
    return this.itemToggles().get(`${itemId}_active`) !== false;
  }

  getConditionalToggle(itemId: string): boolean {
    return this.itemToggles().get(`${itemId}_conditional`) === true;
  }

  setActiveToggle(itemId: string, enabled: boolean): void {
    this.itemToggles.update(m => {
      const next = new Map(m);
      next.set(`${itemId}_active`, enabled);
      return next;
    });
  }

  setConditionalToggle(itemId: string, enabled: boolean): void {
    this.itemToggles.update(m => {
      const next = new Map(m);
      next.set(`${itemId}_conditional`, enabled);
      return next;
    });
  }

  getTogglesRecord(): Record<string, boolean> {
    return Object.fromEntries(this.itemToggles());
  }
}
