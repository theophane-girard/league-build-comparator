import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import { DdragonService, DDRAGON_LOCALES } from '@/shared/services/ddragon.service';
import { ThemeService } from '@/shared/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ZardButtonComponent, ZardIconComponent, ZardSelectComponent, ZardSelectItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sticky top-0 z-10 bg-background border-b border-border">
      <header class="max-w-5xl mx-auto flex items-start justify-between gap-4 px-6 py-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">LoL Build Calculator</h1>
          <p class="text-muted-foreground mt-1">Compare your builds side by side.</p>
        </div>
        <div class="flex items-center gap-2">
          <z-select
            zSize="sm"
            zPlaceholder="Language"
            [zValue]="ddragon.locale()"
            (zSelectionChange)="ddragon.setLocale($any($event))"
            aria-label="Select language"
          >
            @for (loc of locales; track loc.code) {
              <z-select-item [zValue]="loc.code">{{ loc.label }}</z-select-item>
            }
          </z-select>
          <button
            z-button
            zType="outline"
            zSize="sm"
            type="button"
            [attr.aria-label]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
            [attr.aria-pressed]="theme.isDark()"
            (click)="theme.toggle()"
          >
            <i z-icon [zType]="theme.isDark() ? 'sun' : 'moon'"></i>
          </button>
        </div>
      </header>
    </div>
    <router-outlet />
  `,
})
export class App {
  protected readonly ddragon = inject(DdragonService);
  protected readonly theme = inject(ThemeService);
  protected readonly locales = DDRAGON_LOCALES;
}
