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
    const datasets = (config.data?.datasets ?? []).map((ds, i) => {
      const color = theme.datasetColors[i % theme.datasetColors.length];
      return {
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return `color-mix(in oklch, ${color} 75%, transparent)`;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `color-mix(in oklch, ${color} 95%, transparent)`);
          gradient.addColorStop(1, `color-mix(in oklch, ${color} 45%, transparent)`);
          return gradient;
        },
        borderColor: color,
        borderWidth: 2,
        ...ds,
      };
    });

    const themeOptions = {
      animation: {
        duration: 400,
        easing: 'easeInOutQuart',
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: {
            color: theme.legendColor,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            boxWidth: 8,
            boxHeight: 8,
          },
        },
        tooltip: {
          backgroundColor: theme.tooltipBackgroundColor,
          borderColor: theme.tooltipBorderColor,
          borderWidth: 1,
          titleColor: theme.tooltipTitleColor,
          bodyColor: theme.tooltipBodyColor,
          cornerRadius: 8,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
        },
      },
      scales: {
        x: {
          border: { display: false },
          grid: { display: false },
          ticks: {
            color: theme.tickColor,
            font: { size: 12 },
          },
        },
        y: {
          border: { display: false, dash: [4, 4] },
          grid: {
            color: `color-mix(in oklch, ${theme.gridColor} 60%, transparent)`,
          },
          ticks: {
            color: theme.tickColor,
            font: { size: 12 },
            padding: 8,
          },
        },
      },
      layout: {
        padding: { top: 4, right: 8, bottom: 0, left: 0 },
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
