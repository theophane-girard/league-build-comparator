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
  template: `
    <section aria-label="Champion stats" class="rounded-lg border bg-card p-4">
      <h2 class="font-semibold mb-4">Stats</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" role="list">
        @for (row of statRows(); track row.label) {
          <div class="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/30" role="listitem">
            <i z-icon [zType]="row.icon" class="shrink-0 text-muted-foreground" aria-hidden="true"></i>
            <span class="flex-1 text-sm text-muted-foreground">{{ row.label }}</span>
            <div class="flex items-baseline gap-2">
              <span class="font-mono font-semibold text-sm" [attr.aria-label]="row.label + ': ' + formatValue(row.finalValue, row.format)">
                {{ formatValue(row.finalValue, row.format) }}
              </span>
              @if (getDelta(row) !== 0) {
                <span
                  class="font-mono text-xs"
                  [class]="getDelta(row) > 0 ? 'text-green-500' : 'text-red-500'"
                  [attr.aria-label]="'Bonus: ' + (getDelta(row) > 0 ? '+' : '') + formatValue(getDelta(row), row.format)"
                >
                  {{ getDelta(row) > 0 ? '+' : '' }}{{ formatValue(getDelta(row), row.format) }}
                </span>
              }
            </div>
          </div>
        }
      </div>
    </section>
  `,
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
