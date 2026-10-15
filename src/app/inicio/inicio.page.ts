import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import {
  CategoriaResumen,
  DiaResumen,
  Movimiento,
  ResumenMes,
} from '../models/movimiento.model';
import { SheetsService } from '../services/sheets.service';

Chart.register(...registerables);

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: false,
})
export class InicioPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  mes = '';
  resumen: ResumenMes = { ingresos: 0, egresos: 0, balance: 0, cantidad: 0 };
  topCats: CategoriaResumen[] = [];
  recientes: Movimiento[] = [];
  dias: DiaResumen[] = [];
  usingMock = true;
  loading = false;
  private chart?: Chart;

  constructor(
    private readonly sheets: SheetsService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.mes = this.sheets.mesActual();
    this.sheets.getLoading().subscribe((v) => (this.loading = v));
    this.sheets.getUsingMock().subscribe((v) => (this.usingMock = v));
    this.sheets.getMovimientos().subscribe(() => this.refreshView());
    if (!this.sheets.snapshot.length) {
      await this.sheets.init();
    } else {
      this.refreshView();
    }
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  async doRefresh(event: CustomEvent): Promise<void> {
    await this.sheets.refresh();
    this.refreshView();
    (event.target as HTMLIonRefresherElement).complete();
  }

  mesLabel(): string {
    const [y, m] = this.mes.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  }

  openDetalle(id: string): void {
    this.router.navigate(['/detalle', id]);
  }

  openCategoriaDetalle(nombre: string): void {
    this.router.navigate(['/tabs/categorias/detalle', nombre], {
      queryParams: { mes: this.mes },
    });
  }

  private refreshView(): void {
    this.resumen = this.sheets.resumenMes(this.mes);
    this.topCats = this.sheets.topCategorias(this.mes, 5);
    this.recientes = this.sheets.filter({ mes: this.mes }).slice(0, 5);
    this.dias = this.sheets.ultimos7Dias();
    setTimeout(() => this.renderChart(), 0);
  }

  private renderChart(): void {
    if (!this.chartCanvas?.nativeElement) {
      return;
    }
    const labels = this.dias.map((d) => d.label);
    const egresos = this.dias.map((d) => d.egresos);
    const ingresos = this.dias.map((d) => d.ingresos);

    const cfg: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: ingresos,
            backgroundColor: 'rgba(52, 211, 153, 0.85)',
            borderRadius: 8,
            barPercentage: 0.55,
          },
          {
            label: 'Egresos',
            data: egresos,
            backgroundColor: 'rgba(248, 113, 113, 0.85)',
            borderRadius: 8,
            barPercentage: 0.55,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.raw || 0);
                return (
                  ctx.dataset.label +
                  ': ' +
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'DOP',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(v)
                );
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(148,163,184,0.08)' },
          },
          y: {
            ticks: {
              color: '#94a3b8',
              callback: (v) => {
                const n = Number(v);
                if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
                if (n >= 1000) return Math.round(n / 1000) + 'k';
                return String(n);
              },
            },
            grid: { color: 'rgba(148,163,184,0.08)' },
          },
        },
      },
    };

    this.chart?.destroy();
    this.chart = new Chart(this.chartCanvas.nativeElement, cfg);
  }
}
