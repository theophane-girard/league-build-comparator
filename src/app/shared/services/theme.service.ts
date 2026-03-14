import { inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly isDark = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = stored ? stored === 'dark' : prefersDark;
      this.apply(dark);
    }
  }

  toggle(): void {
    this.apply(!this.isDark());
  }

  private apply(dark: boolean): void {
    this.isDark.set(dark);
    if (isPlatformBrowser(this.platformId)) {
      this.document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    }
  }
}
