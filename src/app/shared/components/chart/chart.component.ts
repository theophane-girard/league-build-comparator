import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  DefaultDataPoint,
} from 'chart.js';

@Component({
  selector: 'apps-chart',
  template: `
    <div class="h-full">
      <canvas [attr.id]="chartId()">{{ chart() }}</canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class ChartComponent<Type extends ChartType> {
  public chartId = input.required<string>()
  public config =
    input.required<ChartConfiguration<Type, DefaultDataPoint<Type>>>();
  protected chart = computed(() => new Chart<Type>(this.chartId(), this.config()));
}
