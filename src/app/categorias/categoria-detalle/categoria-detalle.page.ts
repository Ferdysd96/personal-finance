import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Movimiento } from '../../models/movimiento.model';
import { SheetsService } from '../../services/sheets.service';

@Component({
  selector: 'app-categoria-detalle',
  templateUrl: './categoria-detalle.page.html',
  styleUrls: ['./categoria-detalle.page.scss'],
  standalone: false,
})
export class CategoriaDetallePage implements OnInit {
  nombre = '';
  mes = '';
  meses: string[] = [];
  lista: Movimiento[] = [];
  total = 0;
  cantidad = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sheets: SheetsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.nombre = decodeURIComponent(
      this.route.snapshot.paramMap.get('nombre') || ''
    );
    this.mes =
      this.route.snapshot.queryParamMap.get('mes') ||
      this.sheets.mesActual();

    this.sheets.getMovimientos().subscribe(() => this.refresh());

    if (!this.sheets.snapshot.length) {
      await this.sheets.init();
    } else {
      this.refresh();
    }
  }

  refresh(): void {
    this.meses = this.sheets.listMesesDisponibles();
    if (this.mes && !this.meses.includes(this.mes) && this.meses.length) {
      // keep selected mes even if empty; still list available
    }
    this.lista = this.sheets.filter({
      mes: this.mes,
      tipo: 'egreso',
      categoria: this.nombre,
    });
    this.total = this.lista.reduce((s, m) => s + m.monto, 0);
    this.cantidad = this.lista.length;
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

  back(): void {
    this.router.navigateByUrl('/tabs/categorias');
  }
}
