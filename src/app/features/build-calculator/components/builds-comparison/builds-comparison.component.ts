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

export interface StatDef {
  key: string;
  label: string;
  format: StatFormat;
  getValue: (build: SavedBuild) => number;
  /** Returns the champion baseline value for this stat (no items). Used to detect item contribution. */
  getBaseValue?: (build: SavedBuild) => number;
}

export const STAT_DEFS: StatDef[] = [
  { key: 'hp', label: 'HP', format: 'integer', getValue: b => b.finalStats?.hp ?? 0 },
  { key: 'mp', label: 'Mana', format: 'integer', getValue: b => b.finalStats?.mp ?? 0 },
  { key: 'attackDamage', label: 'Attack Damage', format: 'integer', getValue: b => b.finalStats?.attackDamage ?? 0 },
  { key: 'abilityPower', label: 'Ability Power', format: 'integer', getValue: b => b.finalStats?.abilityPower ?? 0 },
  { key: 'armor', label: 'Armor', format: 'integer', getValue: b => b.finalStats?.armor ?? 0 },
  { key: 'magicResist', label: 'Magic Resist', format: 'integer', getValue: b => b.finalStats?.magicResist ?? 0 },
  { key: 'attackSpeed', label: 'Attack Speed', format: 'decimal', getValue: b => b.finalStats?.attackSpeed ?? 0 },
  { key: 'critChance', label: 'Crit Chance', format: 'percent', getValue: b => b.finalStats?.critChance ?? 0 },
  { key: 'movementSpeed', label: 'Movement Speed', format: 'integer', getValue: b => b.finalStats?.movementSpeed ?? 0 },
  { key: 'attackRange', label: 'Attack Range', format: 'integer', getValue: b => b.finalStats?.attackRange ?? 0 },
  { key: 'lethality', label: 'Lethality', format: 'integer', getValue: b => b.finalStats?.lethality ?? 0 },
  { key: 'armorPenPercent', label: 'Armor Pen %', format: 'percent', getValue: b => b.finalStats?.armorPenPercent ?? 0 },
  { key: 'magicPenFlat', label: 'Magic Pen', format: 'integer', getValue: b => b.finalStats?.magicPenFlat ?? 0 },
  { key: 'magicPenPercent', label: 'Magic Pen %', format: 'percent', getValue: b => b.finalStats?.magicPenPercent ?? 0 },
  {
    key: 'physicalDamageReduction', label: 'Phys. Dmg Reduction', format: 'percent',
    getValue: b => b.finalStats?.physicalDamageReduction ?? 0,
    getBaseValue: b => { const a = b.baseStats?.armor ?? 0; return (a / (100 + a)) * 100; },
  },
  {
    key: 'magicalDamageReduction', label: 'Magic Dmg Reduction', format: 'percent',
    getValue: b => b.finalStats?.magicalDamageReduction ?? 0,
    getBaseValue: b => { const mr = b.baseStats?.magicResist ?? 0; return (mr / (100 + mr)) * 100; },
  },
  {
    key: 'effectiveHpPhysical', label: 'Effective HP (Phys)', format: 'integer',
    getValue: b => b.finalStats?.effectiveHpPhysical ?? 0,
    getBaseValue: b => { const hp = b.baseStats?.hp ?? 0; const a = b.baseStats?.armor ?? 0; return hp * (100 + a) / 100; },
  },
  {
    key: 'effectiveHpMagical', label: 'Effective HP (Magic)', format: 'integer',
    getValue: b => b.finalStats?.effectiveHpMagical ?? 0,
    getBaseValue: b => { const hp = b.baseStats?.hp ?? 0; const mr = b.baseStats?.magicResist ?? 0; return hp * (100 + mr) / 100; },
  },
  { key: 'totalGold', label: 'Total Gold', format: 'integer', getValue: b => b.totalGold },
  { key: 'burst', label: 'Burst Damage', format: 'integer', getValue: b => b.damageStats?.burst ?? 0 },
  { key: 'dps', label: 'DPS', format: 'decimal', getValue: b => b.damageStats?.dps ?? 0 },
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
  template: `
    @if (manager.savedBuilds().length === 0) {
      <div class="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <p class="text-sm">Save at least one build to compare.</p>
      </div>
    } @else {
      <app-table
        domLayout="autoHeight"
        [rowData]="rowData()"
        [columnDefs]="columnDefs()"
        [defaultColDef]="defaultColDef"
        [suppressCellFocus]="false"
        ariaLabel="Builds comparison table"
      />

      @if (chartConfig(); as cfg) {
        <div class="rounded-lg border p-4 mt-6" style="height: 360px;" role="region" aria-label="Stat comparison chart">
          <apps-chart [config]="cfg" class="h-full" />
        </div>
      }
    }
  `,
})
export class BuildsComparisonComponent {
  protected readonly manager = inject(BuildsManagerService);
  protected readonly theme = inject(ThemeService);
  private readonly themeResolver = inject(AG_GRID_THEME, { optional: true });

  readonly selectedStatKeys = input<string[]>(STAT_DEFS.map(d => d.key));

  protected readonly filteredStatDefs = computed(() => {
    const keys = this.selectedStatKeys();
    return STAT_DEFS.filter(d => keys.includes(d.key));
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
      headerTooltip: build.champion ? `${build.champion.name} · Lvl ${build.level}` : `Lvl ${build.level}`,
      minWidth: 160,
      sortable: false,
      valueFormatter: (params: { value: number; data: ComparisonRow }) =>
        formatValue(params.value, params.data.format),
      cellStyle: (params: CellClassParams<ComparisonRow>): CellStyle | null => {
        if (this.isBest(params, builds))
          return { color: t?.bestValueText ?? '', fontWeight: '600' };
        if (this.isWorst(params, builds))
          return { color: t?.worstValueText ?? '' };
        return null;
      },
    }));

    return [statCol, ...buildCols];
  });

  protected readonly chartConfig = computed((): ChartConfiguration<'bar'> | null => {
    const builds = this.manager.savedBuilds();
    if (builds.length < 2) return null;
    const statDefs = this.filteredStatDefs();

    const realValues = builds.map(build => statDefs.map(def => def.getValue(build)));

    const datasets = builds.map((build, bi) => ({
      label: build.name,
      data: statDefs.map((def, si) => {
        const max = Math.max(...builds.map(b => def.getValue(b)));
        return max === 0 ? 0 : Math.round((realValues[bi][si] / max) * 100);
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
              label: ctx => {
                const real = realValues[ctx.datasetIndex][ctx.dataIndex];
                const format = statDefs[ctx.dataIndex].format;
                return `${ctx.dataset.label}: ${formatValue(real, format)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: value => value === 100 ? 'Max' : value === 0 ? '0' : '',
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
