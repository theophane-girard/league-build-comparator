import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { type CellClassParams, type CellStyle, type ColDef } from 'ag-grid-community';
import type { ChartConfiguration } from 'chart.js';

import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { ThemeService } from '@/shared/services/theme.service';
import { ChartComponent } from '@/shared/components/chart/chart.component';
import { TableComponent } from '@/shared/components/table/table.component';
import { AG_GRID_THEME } from '@/shared/components/table/table-theme';
import type { SavedBuild } from '../../models/build.model';

type StatFormat = 'integer' | 'decimal' | 'percent';

interface ComparisonRow {
  stat: string;
  format: StatFormat;
  [buildId: string]: number | string;
}

interface StatDef {
  key: string;
  label: string;
  format: StatFormat;
  getValue: (build: SavedBuild) => number;
}

export const STAT_DEFS: StatDef[] = [
  { key: 'hp', label: 'HP', format: 'integer', getValue: b => b.finalStats.hp },
  { key: 'mp', label: 'Mana', format: 'integer', getValue: b => b.finalStats.mp },
  { key: 'attackDamage', label: 'Attack Damage', format: 'integer', getValue: b => b.finalStats.attackDamage },
  { key: 'abilityPower', label: 'Ability Power', format: 'integer', getValue: b => b.finalStats.abilityPower },
  { key: 'armor', label: 'Armor', format: 'integer', getValue: b => b.finalStats.armor },
  { key: 'magicResist', label: 'Magic Resist', format: 'integer', getValue: b => b.finalStats.magicResist },
  { key: 'attackSpeed', label: 'Attack Speed', format: 'decimal', getValue: b => b.finalStats.attackSpeed },
  { key: 'critChance', label: 'Crit Chance', format: 'percent', getValue: b => b.finalStats.critChance },
  { key: 'movementSpeed', label: 'Movement Speed', format: 'integer', getValue: b => b.finalStats.movementSpeed },
  { key: 'attackRange', label: 'Attack Range', format: 'integer', getValue: b => b.finalStats.attackRange },
  { key: 'physicalDamageReduction', label: 'Phys. Dmg Reduction', format: 'percent', getValue: b => b.finalStats.physicalDamageReduction },
  { key: 'magicalDamageReduction', label: 'Magic Dmg Reduction', format: 'percent', getValue: b => b.finalStats.magicalDamageReduction },
  { key: 'effectiveHpPhysical', label: 'Effective HP (Phys)', format: 'integer', getValue: b => b.finalStats.effectiveHpPhysical },
  { key: 'effectiveHpMagical', label: 'Effective HP (Magic)', format: 'integer', getValue: b => b.finalStats.effectiveHpMagical },
  { key: 'totalGold', label: 'Total Gold', format: 'integer', getValue: b => b.totalGold },
];

function formatValue(value: number | undefined, format: StatFormat): string {
  if (value == null) return '—';
  if (format === 'decimal') return value.toFixed(2);
  if (format === 'percent') return Math.round(value) + '%';
  return Math.round(value).toString();
}

@Component({
  selector: 'app-builds-comparison',
  imports: [TableComponent, ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './builds-comparison.component.html',
})
export class BuildsComparisonComponent {
  protected readonly manager = inject(BuildsManagerService);
  protected readonly theme = inject(ThemeService);
  private readonly themeResolver = inject(AG_GRID_THEME, { optional: true });

  readonly selectedStatKeys = input<string[]>(STAT_DEFS.map(d => d.key));

  protected readonly filteredStatDefs = computed(() => {
    const keys = this.selectedStatKeys();
    return keys.length ? STAT_DEFS.filter(d => keys.includes(d.key)) : STAT_DEFS;
  });

  protected readonly rowData = computed((): ComparisonRow[] => {
    const builds = this.manager.savedBuilds();
    return this.filteredStatDefs().map(def => {
      const row: ComparisonRow = { stat: def.label, format: def.format };
      for (const build of builds) {
        row[build.id] = def.getValue(build) ?? 0;
      }
      return row;
    });
  });

  protected readonly columnDefs = computed((): ColDef[] => {
    this.theme.isDark(); // track theme signal for cellStyle reactivity
    const t = this.themeResolver?.();
    const builds = this.manager.savedBuilds();

    const statCol: ColDef = {
      field: 'stat',
      headerName: 'Stat',
      pinned: 'left' as const,
      width: 150,
      sortable: false,
      suppressMovable: true,
    };

    const buildCols: ColDef[] = builds.map(build => ({
      field: build.id,
      headerName: build.name,
      headerTooltip: `${build.champion.name} · Lvl ${build.level}`,
      minWidth: 160,
      sortable: false,
      valueFormatter: (params: { value: number; data: ComparisonRow }) =>
        formatValue(params.value, params.data.format),
      cellStyle: (params: CellClassParams<ComparisonRow>): CellStyle | null => {
        if (this.isBest(params, builds))
          return { backgroundColor: t?.bestValueBg ?? '', color: t?.bestValueText ?? '', fontWeight: '600' };
        if (this.isWorst(params, builds))
          return { backgroundColor: t?.worstValueBg ?? '', color: t?.worstValueText ?? '' };
        return null;
      },
    }));

    return [statCol, ...buildCols];
  });

  protected readonly chartConfig = computed((): ChartConfiguration<'bar'> | null => {
    const builds = this.manager.savedBuilds();
    if (builds.length < 2) return null;
    const statDefs = this.filteredStatDefs();

    const datasets = builds.map(build => ({
      label: build.name,
      data: statDefs.map(def => {
        const statValues = builds.map(b => def.getValue(b));
        const max = Math.max(...statValues);
        return max === 0 ? 0 : Math.round((def.getValue(build) / max) * 100);
      }),
      borderRadius: 8,
    }));

    return {
      type: 'bar',
      data: {
        labels: statDefs.map(def => def.label),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: value => `${value}%`,
            },
          },
        },
      },
    };
  });

  protected readonly defaultColDef: ColDef = {
    flex: 1,
    resizable: true,
  };

  private isBest(params: CellClassParams<ComparisonRow>, builds: SavedBuild[]): boolean {
    if (builds.length < 2 || params.data == null) return false;
    const values = builds.map(b => params.data![b.id] as number);
    return (params.value as number) === Math.max(...values);
  }

  private isWorst(params: CellClassParams<ComparisonRow>, builds: SavedBuild[]): boolean {
    if (builds.length < 2 || params.data == null) return false;
    const values = builds.map(b => params.data![b.id] as number);
    return (params.value as number) === Math.min(...values);
  }
}
