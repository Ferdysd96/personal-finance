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
import { CategoriaResumen } from '../models/movimiento.model';
import { SheetsService } from '../services/sheets.service';

Chart.register(...registerables);

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
  standalone: false,
})
export class CategoriasPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pieCanvas') pieCanvas?: ElementRef<HTMLCanvasElement>;

  mes = '';
  meses: string[] = [];
  cats: CategoriaResumen[] = [];
  total = 0;
  private chart?: Chart;

  private readonly palette = [
    '#34d399', '#2dd4bf', '#22d3ee', '#60a5fa', '#a78bfa',
    '#f472b6', '#fb7185', '#fbbf24', '#a3e635', '#94a3b8',
  ];

  constructor(
    private readonly sheets: SheetsService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.mes = this.sheets.mesActual();
    this.sheets.getMovimientos().subscribe(() => this.refresh());
    if (!this.sheets.snapshot.length) {
      await this.sheets.init();
    } else {
      this.refresh();
    }
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  refresh(): void {
    this.meses = this.sheets.listMesesDisponibles();
    this.cats = this.sheets.categoriasDelMes(this.mes);
    this.total = this.cats.reduce((s, c) => s + c.total, 0);
    setTimeout(() => this.renderChart(), 0);
  }

  mesLabel(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('es-CL', {
      month: 'long',
      year: 'numeric',
    });
  }

  color(i: number): string {
    return this.palette[i % this.palette.length];
  }

  openDetalle(nombre: string): void {
    this.router.navigate(['/tabs/categorias/detalle', nombre], {
      queryParams: { mes: this.mes },
    });
  }

  private renderChart(): void {
    if (!this.pieCanvas?.nativeElement) {
      return;
    }
    const cfg: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: this.cats.map((c) => c.categoria),
        datasets: [
          {
            data: this.cats.map((c) => c.total),
            backgroundColor: this.cats.map((_, i) => this.color(i)),
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.raw || 0);
                return (
                  ' ' +
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
      },
    };
    this.chart?.destroy();
    this.chart = new Chart(this.pieCanvas.nativeElement, cfg);
  }
}