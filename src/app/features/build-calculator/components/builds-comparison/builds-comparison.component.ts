import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  colorSchemeDark,
  colorSchemeLight,
  type ColDef,
  type CellClassParams,
  themeQuartz,
} from 'ag-grid-community';
import type { ChartConfiguration } from 'chart.js';

import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { ThemeService } from '@/shared/services/theme.service';
import { ChartComponent } from '@/shared/components/chart/chart.component';
import type { SavedBuild } from '../../models/build.model';

type StatFormat = 'integer' | 'decimal' | 'percent';

interface ComparisonRow {
  stat: string;
  format: StatFormat;
  [buildId: string]: number | string;
}

interface StatDef {
  key: keyof SavedBuild['finalStats'];
  label: string;
  format: StatFormat;
}

const STAT_DEFS: StatDef[] = [
  { key: 'hp', label: 'HP', format: 'integer' },
  { key: 'mp', label: 'Mana', format: 'integer' },
  { key: 'attackDamage', label: 'Attack Damage', format: 'integer' },
  { key: 'abilityPower', label: 'Ability Power', format: 'integer' },
  { key: 'armor', label: 'Armor', format: 'integer' },
  { key: 'magicResist', label: 'Magic Resist', format: 'integer' },
  { key: 'attackSpeed', label: 'Attack Speed', format: 'decimal' },
  { key: 'critChance', label: 'Crit Chance', format: 'percent' },
  { key: 'movementSpeed', label: 'Movement Speed', format: 'integer' },
  { key: 'attackRange', label: 'Attack Range', format: 'integer' },
];

function formatValue(value: number, format: StatFormat): string {
  if (format === 'decimal') return value.toFixed(2);
  if (format === 'percent') return Math.round(value) + '%';
  return Math.round(value).toString();
}

@Component({
  selector: 'app-builds-comparison',
  imports: [AgGridAngular, ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './builds-comparison.component.html',
})
export class BuildsComparisonComponent {
  protected readonly manager = inject(BuildsManagerService);
  protected readonly theme = inject(ThemeService);

  protected readonly gridTheme = computed(() =>
    this.theme.isDark()
      ? themeQuartz.withPart(colorSchemeDark)
      : themeQuartz.withPart(colorSchemeLight),
  );

  protected readonly rowData = computed((): ComparisonRow[] => {
    const builds = this.manager.savedBuilds();
    return STAT_DEFS.map(def => {
      const row: ComparisonRow = { stat: def.label, format: def.format };
      for (const build of builds) {
        row[build.id] = build.finalStats[def.key] as number;
      }
      return row;
    });
  });

  protected readonly columnDefs = computed((): ColDef[] => {
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
      cellClassRules: {
        'ag-best-value': (params: CellClassParams<ComparisonRow>) =>
          this.isBest(params, builds),
        'ag-worst-value': (params: CellClassParams<ComparisonRow>) =>
          this.isWorst(params, builds),
      },
    }));

    return [statCol, ...buildCols];
  });

  private static readonly CHART_COLORS = [
    '#36A2EB',
    '#FF6384',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
  ];

  protected readonly chartConfig = computed((): ChartConfiguration<'bar'> | null => {
    const builds = this.manager.savedBuilds();
    if (builds.length < 2) return null;
    const isDark = this.theme.isDark();
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    const datasets = builds.map((build, i) => ({
      label: build.name,
      data: STAT_DEFS.map(def => {
        const statValues = builds.map(b => b.finalStats[def.key] as number);
        const max = Math.max(...statValues);
        return max === 0 ? 0 : Math.round(((build.finalStats[def.key] as number) / max) * 100);
      }),
      backgroundColor: BuildsComparisonComponent.CHART_COLORS[i % BuildsComparisonComponent.CHART_COLORS.length],
      borderRadius: 4,
    }));

    return {
      type: 'bar',
      data: {
        labels: STAT_DEFS.map(def => def.label),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor } },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: textColor,
              callback: value => `${value}%`,
            },
            grid: { color: gridColor },
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
