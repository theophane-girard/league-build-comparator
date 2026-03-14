import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ZardIconComponent, type ZardIcon } from '@/shared/components/icon';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';

interface StatRow {
  label: string;
  icon: ZardIcon;
  baseValue: number;
  finalValue: number;
  format: 'integer' | 'decimal' | 'percent';
}

@Component({
  selector: 'app-stats-panel',
  imports: [ZardIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-panel.component.html',
})
export class StatsPanelComponent {
  protected readonly build = inject(BuildCalculatorService);

  protected readonly statRows = computed((): StatRow[] => {
    const base = this.build.baseStats();
    const final = this.build.finalStats();
    if (!base || !final) return [];

    return [
      { label: 'HP', icon: 'heart-pulse', baseValue: base.hp, finalValue: final.hp, format: 'integer' },
      { label: 'Mana', icon: 'droplets', baseValue: base.mp, finalValue: final.mp, format: 'integer' },
      { label: 'Attack Damage', icon: 'swords', baseValue: base.attackDamage, finalValue: final.attackDamage, format: 'integer' },
      { label: 'Ability Power', icon: 'zap', baseValue: 0, finalValue: final.abilityPower, format: 'integer' },
      { label: 'Armor', icon: 'shield', baseValue: base.armor, finalValue: final.armor, format: 'integer' },
      { label: 'Magic Resist', icon: 'shield-half', baseValue: base.magicResist, finalValue: final.magicResist, format: 'integer' },
      { label: 'Attack Speed', icon: 'gauge', baseValue: base.attackSpeed, finalValue: final.attackSpeed, format: 'decimal' },
      { label: 'Crit Chance', icon: 'crosshair', baseValue: base.critChance, finalValue: final.critChance, format: 'percent' },
      { label: 'Movement Speed', icon: 'footprints', baseValue: base.movementSpeed, finalValue: final.movementSpeed, format: 'integer' },
      { label: 'Attack Range', icon: 'target', baseValue: base.attackRange, finalValue: final.attackRange, format: 'integer' },
    ];
  });

  formatValue(value: number, format: 'integer' | 'decimal' | 'percent'): string {
    if (format === 'decimal') return value.toFixed(2);
    if (format === 'percent') return value.toFixed(0) + '%';
    return Math.round(value).toString();
  }

  getDelta(row: StatRow): number {
    return row.finalValue - row.baseValue;
  }
}
