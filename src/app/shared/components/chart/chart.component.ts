import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  type ChartConfiguration,
  type ChartType,
  type DefaultDataPoint,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';

import { ThemeService } from '@/shared/services/theme.service';
import { CHART_THEME, type ChartTheme } from './chart-theme';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

@Component({
  selector: 'apps-chart',
  template: `
    <div class="h-full">
      <canvas #canvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class ChartComponent<Type extends ChartType> implements AfterViewInit, OnDestroy {
  public config = input.required<ChartConfiguration<Type, DefaultDataPoint<Type>>>();

  private readonly themeService = inject(ThemeService);
  private readonly themeResolver = inject(CHART_THEME, { optional: true });

  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chartInstance: Chart<Type> | null = null;
  private readonly viewReady = signal(false);

  constructor() {
    effect(() => {
      if (!this.viewReady()) return;
      this.themeService.isDark(); // track theme changes as signal dependency
      const config = this.config();
      const theme = this.themeResolver?.();
      const themedConfig = theme ? this.applyTheme(config, theme) : config;
      this.chartInstance?.destroy();
      this.chartInstance = new Chart<Type>(this.canvasRef().nativeElement, themedConfig);
    });
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.chartInstance?.destroy();
  }

  private applyTheme(
    config: ChartConfiguration<Type, DefaultDataPoint<Type>>,
    theme: ChartTheme,
  ): ChartConfiguration<Type, DefaultDataPoint<Type>> {
    const datasets = (config.data?.datasets ?? []).map((ds, i) => ({
      backgroundColor: theme.datasetColors[i % theme.datasetColors.length],
      ...ds,
    }));

    const themeOptions = {
      plugins: {
        legend: {
          labels: { color: theme.legendColor },
        },
        tooltip: {
          backgroundColor: theme.tooltipBackgroundColor,
          borderColor: theme.tooltipBorderColor,
          borderWidth: 1,
          titleColor: theme.tooltipTitleColor,
          bodyColor: theme.tooltipBodyColor,
        },
      },
      scales: {
        x: {
          ticks: { color: theme.tickColor },
          grid: { color: theme.gridColor },
        },
        y: {
          ticks: { color: theme.tickColor },
          grid: { color: theme.gridColor },
        },
      },
    };

    return {
      ...config,
      data: { ...config.data, datasets },
      options: deepMerge(themeOptions, (config.options ?? {}) as Record<string, unknown>) as ChartConfiguration<Type>['options'],
    };
  }
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const overrideVal = override[key];
    const baseVal = base[key];
    if (isPlainObject(overrideVal) && isPlainObject(baseVal)) {
      result[key] = deepMerge(baseVal as Record<string, unknown>, overrideVal as Record<string, unknown>);
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal;
    }
  }
  return result;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}
