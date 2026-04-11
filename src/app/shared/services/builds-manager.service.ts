import { computed, effect, inject, Injectable, signal } from '@angular/core';

import type { Item } from '@/features/build-calculator/models/item.model';
import type { SavedBuild } from '@/features/build-calculator/models/build.model';
import { calculateBaseStats, combineStats, sumConditionalBonuses, sumItemStats } from '@/shared/utils/stats-calculator';
import { calculateDamageStats } from '@/shared/utils/damage-calculator';
import { getSpellRanks } from '@/shared/utils/spell-rank';
import { BuildCalculatorService } from './build-calculator.service';

@Injectable({ providedIn: 'root' })
export class BuildsManagerService {
  private readonly buildCalc = inject(BuildCalculatorService);

  readonly savedBuilds = signal<SavedBuild[]>([]);
  readonly editingBuildId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const selectedChampion = this.buildCalc.selectedChampion();
      const level = this.buildCalc.selectedLevel();
      this.savedBuilds.update(builds =>
        builds.map(build => {
          const champion = build.champion ?? selectedChampion;
          if (!champion) return build;
          const baseStats = calculateBaseStats(champion.stats, level);
          const nonNullItems = build.items.filter((i): i is Item => i !== null);
          const toggles = new Map<string, boolean>(Object.entries(build.itemToggles ?? {}));
          const itemBonuses = sumItemStats(nonNullItems);
          const conditional = sumConditionalBonuses(nonNullItems, toggles, itemBonuses);
          const finalStats = combineStats(baseStats, {
            hp: itemBonuses.hp + (conditional.hp ?? 0),
            mp: itemBonuses.mp,
            armor: itemBonuses.armor + (conditional.armor ?? 0),
            magicResist: itemBonuses.magicResist + (conditional.magicResist ?? 0),
            attackDamage: itemBonuses.attackDamage + (conditional.attackDamage ?? 0),
            abilityPower: itemBonuses.abilityPower + (conditional.abilityPower ?? 0),
            movementSpeed: itemBonuses.movementSpeed,
            critChance: itemBonuses.critChance + (conditional.critChance ?? 0),
            attackSpeedBonus: itemBonuses.attackSpeedBonus + (conditional.attackSpeedBonus ?? 0),
            lethality: itemBonuses.lethality,
            armorPenPercent: itemBonuses.armorPenPercent,
            magicPenFlat: itemBonuses.magicPenFlat,
            magicPenPercent: itemBonuses.magicPenPercent,
          });
          const damageStats = champion.spells?.length
            ? calculateDamageStats(champion.spells, getSpellRanks(level), finalStats, baseStats, build.items, toggles)
            : undefined;
          return { ...build, champion, level, baseStats, finalStats, damageStats };
        }),
      );
    });
  }

  readonly canSave = computed(() => true);

  readonly buildCount = computed(() => this.savedBuilds().length);

  openNewBuild(prefillBuild?: SavedBuild): void {
    this.editingBuildId.set(null);
    if (prefillBuild) {
      this.buildCalc.prefillFromBuild(prefillBuild);
    } else {
      this.buildCalc.clearItems();
    }
    this.buildCalc.openItemPicker(0);
  }

  openEditBuild(build: SavedBuild): void {
    this.editingBuildId.set(build.id);
    this.buildCalc.prefillFromBuild(build);
    this.buildCalc.openItemPicker(0);
  }

  saveBuild(): void {
    const champion = this.buildCalc.selectedChampion() ?? undefined;
    const finalStats = this.buildCalc.finalStats() ?? undefined;
    const baseStats = this.buildCalc.baseStats() ?? undefined;
    const damageStats = this.buildCalc.damageStats() ?? undefined;
    const itemToggles = this.buildCalc.getTogglesRecord();

    const items = [...this.buildCalc.selectedItems()];
    const totalGold = items.reduce((sum, item) => sum + (item?.gold.total ?? 0), 0);
    const editingId = this.editingBuildId();
    const itemNames = items.filter(i => i !== null).map(i => i!.name);
    const name = itemNames.length > 0 ? itemNames.join(' - ') : `Build ${this.savedBuilds().length + 1}`;

    if (editingId) {
      this.savedBuilds.update(list =>
        list.map(b =>
          b.id === editingId
            ? {
                ...b,
                name,
                champion,
                level: this.buildCalc.selectedLevel(),
                items,
                baseStats,
                finalStats,
                totalGold,
                damageStats,
                itemToggles,
              }
            : b,
        ),
      );
      this.editingBuildId.set(null);
    } else {
      const build: SavedBuild = {
        id: `build-${Date.now()}`,
        name,
        champion,
        level: this.buildCalc.selectedLevel(),
        items,
        baseStats,
        finalStats,
        totalGold,
        damageStats,
        itemToggles,
      };
      this.savedBuilds.update(list => [...list, build]);
    }
  }

  renameBuild(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.savedBuilds.update(list =>
      list.map(b => b.id === id ? { ...b, name: trimmed } : b)
    );
  }

  removeBuild(id: string): void {
    this.savedBuilds.update(list => list.filter(b => b.id !== id));
  }
}
