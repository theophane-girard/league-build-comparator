import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  ChartType,
  DefaultDataPoint,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

@Component({
  selector: 'apps-chart',
  template: `
    <div class="h-full">
      <canvas #canvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class ChartComponent<Type extends ChartType> implements AfterViewInit, OnDestroy {
  public config = input.required<ChartConfiguration<Type, DefaultDataPoint<Type>>>();

  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chartInstance: Chart<Type> | null = null;
  private readonly viewReady = signal(false);

  constructor() {
    effect(() => {
      if (!this.viewReady()) return;
      const config = this.config();
      this.chartInstance?.destroy();
      this.chartInstance = new Chart<Type>(this.canvasRef().nativeElement, config);
    });
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.chartInstance?.destroy();
  }
}
