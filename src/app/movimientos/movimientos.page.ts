import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Movimiento, TipoMovimiento } from '../models/movimiento.model';
import { SheetsService } from '../services/sheets.service';

@Component({
  selector: 'app-movimientos',
  templateUrl: './movimientos.page.html',
  styleUrls: ['./movimientos.page.scss'],
  standalone: false,
})
export class MovimientosPage implements OnInit {
  mes = '';
  tipo: TipoMovimiento | 'todos' = 'todos';
  categoria = 'todas';
  search = '';
  meses: string[] = [];
  categorias: string[] = [];
  lista: Movimiento[] = [];
  filtersOpen = false;

  constructor(
    private readonly sheets: SheetsService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.mes = this.sheets.mesActual();
    this.sheets.getMovimientos().subscribe(() => this.apply());
    if (!this.sheets.snapshot.length) {
      await this.sheets.init();
    } else {
      this.apply();
    }
  }

  apply(): void {
    this.meses = this.sheets.listMesesDisponibles();
    this.categorias = this.sheets.listCategorias();
    this.lista = this.sheets.filter({
      mes: this.mes,
      tipo: this.tipo,
      categoria: this.categoria,
      search: this.search,
    });
  }

  mesLabel(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('es-CL', {
      month: 'long',
      year: 'numeric',
    });
  }

  openDetalle(id: string): void {
    this.router.navigate(['/detalle', id]);
  }

  async doRefresh(event: CustomEvent): Promise<void> {
    await this.sheets.refresh();
    this.apply();
    (event.target as HTMLIonRefresherElement).complete();
  }

  clearFilters(): void {
    this.tipo = 'todos';
    this.categoria = 'todas';
    this.search = '';
    this.mes = this.sheets.mesActual();
    this.apply();
  }
}
