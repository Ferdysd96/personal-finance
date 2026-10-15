import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular/lazy';
import { ConfigService } from '../services/config.service';
import { SheetsService } from '../services/sheets.service';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  standalone: false,
})
export class AjustesPage implements OnInit {
  spreadsheetId = '';
  sheetName = 'Movimientos';
  lastSync: Date | null = null;
  usingMock = true;
  loading = false;
  error: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly sheets: SheetsService,
    private readonly toastCtrl: ToastController
  ) {}

  async ngOnInit(): Promise<void> {
    await this.config.load();
    this.spreadsheetId = this.config.snapshot.spreadsheetId;
    this.sheetName = this.config.snapshot.sheetName;
    this.sheets.getLastSync().subscribe((d) => (this.lastSync = d));
    this.sheets.getUsingMock().subscribe((v) => (this.usingMock = v));
    this.sheets.getLoading().subscribe((v) => (this.loading = v));
    this.sheets.getError().subscribe((e) => (this.error = e));
    if (!this.sheets.snapshot.length) {
      await this.sheets.init();
    }
  }

  async guardar(): Promise<void> {
    await this.config.update({
      spreadsheetId: (this.spreadsheetId || '').trim() || 'REPLACE_ME',
      sheetName: (this.sheetName || 'Movimientos').trim(),
    });
    await this.sheets.refresh();
    const t = await this.toastCtrl.create({
      message: this.usingMock
        ? 'Configuración guardada. Usando datos mock.'
        : 'Configuración guardada. Intentando sincronizar Sheet…',
      duration: 2200,
      color: 'success',
      position: 'bottom',
    });
    await t.present();
  }

  async refrescar(): Promise<void> {
    await this.sheets.refresh();
    const t = await this.toastCtrl.create({
      message: 'Datos actualizados',
      duration: 1600,
      color: 'primary',
      position: 'bottom',
    });
    await t.present();
  }

  lastSyncLabel(): string {
    if (!this.lastSync) {
      return 'Nunca';
    }
    return this.lastSync.toLocaleString('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
}
