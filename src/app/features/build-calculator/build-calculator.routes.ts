import { Routes } from '@angular/router';

export const buildCalculatorRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/build-calculator-page/build-calculator-page.component').then(
        m => m.BuildCalculatorPageComponent
      ),
  },
];

export default buildCalculatorRoutes;
