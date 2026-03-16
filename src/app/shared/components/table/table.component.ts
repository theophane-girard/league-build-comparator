import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { type ColDef, themeQuartz } from 'ag-grid-community';

import { ThemeService } from '@/shared/services/theme.service';
import { AG_GRID_THEME } from './table-theme';

@Component({
  selector: 'app-table',
  template: `
    <ag-grid-angular
      class="w-full"
      [domLayout]="domLayout()"
      [theme]="agTheme()"
      [rowData]="rowData()"
      [columnDefs]="columnDefs()"
      [defaultColDef]="defaultColDef()"
      [suppressCellFocus]="suppressCellFocus()"
      [attr.aria-label]="ariaLabel()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
})
export class TableComponent {
  readonly rowData = input<unknown[]>([]);
  readonly columnDefs = input<ColDef[]>([]);
  readonly defaultColDef = input<ColDef>({});
  readonly suppressCellFocus = input(false);
  readonly domLayout = input<'autoHeight' | 'normal' | 'print'>('normal');
  readonly ariaLabel = input<string | null>(null);

  private readonly themeService = inject(ThemeService);
  private readonly themeResolver = inject(AG_GRID_THEME, { optional: true });

  readonly agTheme = computed(() => {
    this.themeService.isDark(); // track signal dependency for theme reactivity
    const t = this.themeResolver?.();
    if (!t?.backgroundColor) return themeQuartz;

    return themeQuartz.withParams({
      backgroundColor: t.backgroundColor,
      foregroundColor: t.foregroundColor,
      borderColor: t.borderColor,
      headerBackgroundColor: t.headerBackgroundColor,
      headerTextColor: t.headerTextColor,
      rowHoverColor: t.rowHoverColor,
      fontSize: 13,
      fontFamily: 'inherit',
      wrapperBorderRadius: 8,
    });
  });
}
