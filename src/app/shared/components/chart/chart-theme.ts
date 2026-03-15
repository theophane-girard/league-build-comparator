import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ChartTheme {
  /** Dataset fill colors (chart-1 → chart-5) */
  datasetColors: string[];
  /** Axis tick label color */
  tickColor: string;
  /** Legend label color */
  legendColor: string;
  /** Grid line color */
  gridColor: string;
  /** Tooltip background color */
  tooltipBackgroundColor: string;
  /** Tooltip border color */
  tooltipBorderColor: string;
  /** Tooltip title text color */
  tooltipTitleColor: string;
  /** Tooltip body text color */
  tooltipBodyColor: string;
}

export type ChartThemeResolver = () => ChartTheme;

export const CHART_THEME = new InjectionToken<ChartThemeResolver>('CHART_THEME');

export function defaultChartThemeResolver(): ChartTheme {
  const style = getComputedStyle(document.documentElement);
  const css = (prop: string) => style.getPropertyValue(prop).trim();

  return {
    datasetColors: [
      css('--chart-1'),
      css('--chart-2'),
      css('--chart-3'),
      css('--chart-4'),
      css('--chart-5'),
    ],
    tickColor: css('--muted-foreground'),
    legendColor: css('--foreground'),
    gridColor: css('--border'),
    tooltipBackgroundColor: css('--popover'),
    tooltipBorderColor: css('--border'),
    tooltipTitleColor: css('--popover-foreground'),
    tooltipBodyColor: css('--muted-foreground'),
  };
}

export function provideChartTheme(resolver?: ChartThemeResolver): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CHART_THEME,
      useFactory: (platformId: object) => {
        if (!isPlatformBrowser(platformId)) {
          return () => ({
            datasetColors: [],
            tickColor: '',
            legendColor: '',
            gridColor: '',
            tooltipBackgroundColor: '',
            tooltipBorderColor: '',
            tooltipTitleColor: '',
            tooltipBodyColor: '',
          });
        }
        return resolver ?? defaultChartThemeResolver;
      },
      deps: [PLATFORM_ID],
    },
  ]);
}
