import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/lazy';
import { TipoMovimiento } from '../models/movimiento.model';
import { SheetsService } from '../services/sheets.service';

@Component({
  selector: 'app-ingreso-manual',
  templateUrl: './ingreso-manual.page.html',
  styleUrls: ['./ingreso-manual.page.scss'],
  standalone: false,
})
export class IngresoManualPage implements OnInit {
  tipo: TipoMovimiento = 'ingreso';
  fecha = '';
  monto: number | null = null;
  moneda: 'DOP' | 'USD' = 'DOP';
  categoria = 'salario';
  descripcion = '';
  cuenta = '';
  /** Egreso pagado con efectivo ya retirado del banco: no vuelve a sumar al balance. */
  pagadoConEfectivo = false;
  saving = false;

  constructor(
    private readonly sheets: SheetsService,
    private readonly router: Router,
    private readonly toast: ToastController
  ) {}

  ngOnInit(): void {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.fecha = y + '-' + m + '-' + day;
  }

  onTipoChange(): void {
    if (this.tipo === 'ingreso') {
      this.pagadoConEfectivo = false;
      if (!this.categoria || this.categoria === 'gasto' || this.categoria === 'compra') {
        this.categoria = 'salario';
      }
    }
    if (this.tipo === 'egreso' && (!this.categoria || this.categoria === 'salario' || this.categoria === 'ingreso')) {
      this.categoria = 'gasto';
    }
  }

  get titulo(): string {
    return this.tipo === 'egreso' ? 'Nuevo egreso' : 'Nuevo ingreso';
  }

  get canSave(): boolean {
    return (
      !!this.fecha &&
      !!this.descripcion.trim() &&
      this.monto != null &&
      Number(this.monto) > 0
    );
  }

  async guardar(): Promise<void> {
    if (!this.canSave || this.saving) {
      return;
    }
    this.saving = true;
    try {
      const mov = this.sheets.addManualMovimiento({
        tipo: this.tipo,
        fecha: this.fecha,
        monto: Number(this.monto),
        moneda: this.moneda,
        categoria: this.categoria || (this.tipo === 'egreso' ? 'gasto' : 'ingreso'),
        descripcion: this.descripcion,
        cuenta: this.cuenta,
        noSumarBalance: this.tipo === 'egreso' && this.pagadoConEfectivo,
        excluirDeCategorias: false,
      });
      const label = this.tipo === 'egreso' ? 'Egreso' : 'Ingreso';
      const t = await this.toast.create({
        message: label + ' guardado localmente',
        duration: 1800,
        color: 'success',
        position: 'bottom',
      });
      await t.present();
      this.router.navigate(['/detalle', mov.id]);
    } finally {
      this.saving = false;
    }
  }

  cancelar(): void {
    this.router.navigateByUrl('/tabs/movimientos');
  }
}
