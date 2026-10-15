import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/lazy';
import { Movimiento } from '../models/movimiento.model';
import { SheetsService } from '../services/sheets.service';
import { esRetiroEfectivo } from '../services/movimiento-flags.service';

@Component({
  selector: 'app-detalle',
  templateUrl: './detalle.page.html',
  styleUrls: ['./detalle.page.scss'],
  standalone: false,
})
export class DetallePage implements OnInit {
  mov?: Movimiento;
  isManual = false;
  deleting = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sheets: SheetsService,
    private readonly alertCtrl: AlertController,
    private readonly toastCtrl: ToastController
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.sheets.snapshot.length) {
      await this.sheets.init();
    }
    this.reload();
  }

  private reload(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.mov = this.sheets.getById(id);
    this.isManual = !!this.mov && this.sheets.isManual(id);
  }

  get pareceRetiro(): boolean {
    if (!this.mov || this.mov.tipo !== 'egreso') return false;
    return esRetiroEfectivo(this.mov.categoria, this.mov.descripcion);
  }

  back(): void {
    this.router.navigateByUrl('/tabs/movimientos');
  }

  toggleExcluirCategorias(ev: CustomEvent): void {
    if (!this.mov) return;
    const checked = !!(ev.detail as { checked?: boolean }).checked;
    this.sheets.setFlags(this.mov.id, { excluirDeCategorias: checked });
    this.reload();
  }

  toggleNoSumarBalance(ev: CustomEvent): void {
    if (!this.mov) return;
    const checked = !!(ev.detail as { checked?: boolean }).checked;
    this.sheets.setFlags(this.mov.id, { noSumarBalance: checked });
    this.reload();
  }

  async confirmarEliminar(): Promise<void> {
    if (!this.mov || !this.isManual || this.deleting) {
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Eliminar movimiento',
      message: '¿Eliminar este movimiento manual de este dispositivo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.eliminar();
          },
        },
      ],
    });
    await alert.present();
  }

  private async eliminar(): Promise<void> {
    if (!this.mov || !this.isManual) {
      return;
    }
    this.deleting = true;
    try {
      const ok = this.sheets.removeManual(this.mov.id);
      const toast = await this.toastCtrl.create({
        message: ok ? 'Movimiento eliminado' : 'No se pudo eliminar',
        duration: 1800,
        color: ok ? 'success' : 'danger',
        position: 'bottom',
      });
      await toast.present();
      if (ok) {
        this.router.navigateByUrl('/tabs/movimientos');
      }
    } finally {
      this.deleting = false;
    }
  }
}
