import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZardButtonComponent } from './shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ZardButtonComponent, ZardIconComponent],
  template: `
    <button z-button zType="outline">Button</button>
    <button z-button zType="outline"><i z-icon zType="arrow-up"></i></button>
    <button z-button zType="outline">
      Button
      <i z-icon zType="popcorn"></i>
    </button>

    <button z-button zSize="sm">Default</button>
    <button z-button zSize="sm" zType="outline">Outline</button>
    <button z-button zSize="sm" zType="destructive">Destructive</button>
    <button z-button zSize="sm" zType="secondary">Secondary</button>
    <button z-button zSize="sm" zType="ghost">Ghost</button>
    <button z-button zSize="sm" zType="link">Link</button>
  `,
})
export class App {
  protected readonly title = signal('zard-test');
}
