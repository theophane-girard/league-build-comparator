import {
  EnvironmentProviders,
  InjectionToken,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AgGridTheme {
  /** Main grid background */
  backgroundColor: string;
  /** Default text color */
  foregroundColor: string;
  /** Border color for cells and grid wrapper */
  borderColor: string;
  /** Header row background */
  headerBackgroundColor: string;
  /** Header text color */
  headerTextColor: string;
  /** Row background on hover */
  rowHoverColor: string;
  /** Highlight background for highest-value cell */
  bestValueBg: string;
  /** Highlight text color for highest-value cell */
  bestValueText: string;
  /** Highlight background for lowest-value cell */
  worstValueBg: string;
  /** Highlight text color for lowest-value cell */
  worstValueText: string;
}

export type AgGridThemeResolver = () => AgGridTheme;

export const AG_GRID_THEME = new InjectionToken<AgGridThemeResolver>('AG_GRID_THEME');

export function defaultAgGridThemeResolver(): AgGridTheme {
  const style = getComputedStyle(document.documentElement);
  const css = (prop: string) => style.getPropertyValue(prop).trim();

  return {
    backgroundColor: css('--card'),
    foregroundColor: css('--foreground'),
    borderColor: css('--border'),
    headerBackgroundColor: css('--muted'),
    headerTextColor: css('--muted-foreground'),
    rowHoverColor: css('--accent'),
    bestValueBg: css('--ag-best-value-bg'),
    bestValueText: css('--ag-best-value-color'),
    worstValueBg: css('--ag-worst-value-bg'),
    worstValueText: css('--ag-worst-value-color'),
  };
}

export function provideAgGridTheme(resolver?: AgGridThemeResolver): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: AG_GRID_THEME,
      useFactory: (platformId: object) => {
        if (!isPlatformBrowser(platformId)) {
          return () =>
            ({
              backgroundColor: '',
              foregroundColor: '',
              borderColor: '',
              headerBackgroundColor: '',
              headerTextColor: '',
              rowHoverColor: '',
              bestValueBg: '',
              bestValueText: '',
              worstValueBg: '',
              worstValueText: '',
            }) satisfies AgGridTheme;
        }
        return resolver ?? defaultAgGridThemeResolver;
      },
      deps: [PLATFORM_ID],
    },
  ]);
}
