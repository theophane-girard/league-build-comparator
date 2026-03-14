import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'build-calculator', pathMatch: 'full' },
  {
    path: 'build-calculator',
    loadChildren: () => import('./features/build-calculator/build-calculator.routes'),
  },
];
