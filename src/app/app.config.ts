import { ApplicationConfig, inject, PLATFORM_ID, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ThemeService } from '@/shared/services/theme.service';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideZard } from '@/shared/core/provider/providezard';
import { provideChartTheme } from '@/shared/components/chart/chart-theme';
import { provideAgGridTheme } from '@/shared/components/table/table-theme';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { firebaseConfig } from './firebase.config';

ModuleRegistry.registerModules([AllCommunityModule]);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      inject(ThemeService).init();
    }),
    provideAppInitializer(() => {
      const platformId = inject(PLATFORM_ID);
      const app = initializeApp(firebaseConfig);
      if (isPlatformBrowser(platformId)) {
        getAnalytics(app);
      }
    }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideZard(),
    provideChartTheme(),
    provideAgGridTheme(),
  ]
};
