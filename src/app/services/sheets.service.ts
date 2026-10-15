import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  AppConfig,
  CategoriaResumen,
  DiaResumen,
  Movimiento,
  ResumenMes,
  TipoMovimiento,
} from '../models/movimiento.model';
import { ConfigService } from './config.service';
import { ManualMovimientosService } from './manual-movimientos.service';
import {
  MovimientoFlagsService,
  esRetiroEfectivo,
} from './movimiento-flags.service';
import { MOCK_MOVIMIENTOS } from './mock-data';

/**
 * Abstracción lista para Google Sheets API v4.
 * MVP: datos mock cuando spreadsheetId === REPLACE_ME.
 * Futuro: GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}?key=API_KEY
 * Los ingresos manuales viven en localStorage y se fusionan en memoria.
 */
@Injectable({ providedIn: 'root' })
export class SheetsService {
  private readonly movimientos$ = new BehaviorSubject<Movimiento[]>([]);
  private readonly loading$ = new BehaviorSubject<boolean>(false);
  private readonly lastSync$ = new BehaviorSubject<Date | null>(null);
  private readonly usingMock$ = new BehaviorSubject<boolean>(true);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  /** Filas de Sheet/mock sin los manuales locales. */
  private baseRows: Movimiento[] = [];

  constructor(
    private readonly http: HttpClient,
    private readonly config: ConfigService,
    private readonly manual: ManualMovimientosService,
    private readonly flags: MovimientoFlagsService
  ) {}

  getMovimientos() {
    return this.movimientos$.asObservable();
  }

  getLoading() {
    return this.loading$.asObservable();
  }

  getLastSync() {
    return this.lastSync$.asObservable();
  }

  getUsingMock() {
    return this.usingMock$.asObservable();
  }

  getError() {
    return this.error$.asObservable();
  }

  get snapshot(): Movimiento[] {
    return this.movimientos$.value;
  }

  async init(): Promise<void> {
    await this.config.load();
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      await this.config.load();
      const cfg = this.config.snapshot;

      if (this.config.isUsingMock()) {
        this.usingMock$.next(true);
        this.publishMerged(this.cloneMock());
        this.lastSync$.next(new Date());
        return;
      }

      // Preparado para Sheets API v4 (requiere apiKey + spreadsheetId reales)
      const rows = await this.fetchFromGoogleSheets(cfg);
      this.usingMock$.next(false);
      this.publishMerged(rows);
      this.lastSync$.next(new Date());
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al sincronizar movimientos';
      this.error$.next(msg);
      // Fallback a mock para que la UI siga usable
      this.usingMock$.next(true);
      this.publishMerged(this.cloneMock());
      this.lastSync$.next(new Date());
    } finally {
      this.loading$.next(false);
    }
  }

  /** Publica Sheet/mock + entradas manuales de localStorage. */
  private publishMerged(base: Movimiento[]): void {
    this.baseRows = base;
    const sheetIds = new Set(base.map((m) => m.id));
    const manuals = this.manual
      .list()
      .filter((m) => !sheetIds.has(m.id))
      .map((m) => this.applyFlags(m));
    const sheetRows = base.map((m) => this.applyFlags(m));
    this.movimientos$.next([...sheetRows, ...manuals]);
  }

  /** Aplica flags locales + auto-detección de retiros de efectivo. */
  private applyFlags(m: Movimiento): Movimiento {
    const stored = this.flags.get(m.id);
    const autoRetiro =
      m.tipo === 'egreso' && esRetiroEfectivo(m.categoria, m.descripcion);
    return {
      ...m,
      noSumarBalance:
        stored.noSumarBalance !== undefined
          ? stored.noSumarBalance
          : !!m.noSumarBalance,
      excluirDeCategorias:
        stored.excluirDeCategorias !== undefined
          ? stored.excluirDeCategorias
          : m.excluirDeCategorias !== undefined
            ? !!m.excluirDeCategorias
            : autoRetiro,
    };
  }

  setFlags(
    id: string,
    patch: { noSumarBalance?: boolean; excluirDeCategorias?: boolean }
  ): void {
    this.flags.set(id, patch);
    this.remountManual();
  }

  /** Re-fusiona manuales actuales sin volver a pedir la Sheet. */
  remountManual(): void {
    this.publishMerged(this.baseRows.length ? this.baseRows : this.cloneMock());
  }

  addManualMovimiento(input: {
    tipo: 'ingreso' | 'egreso';
    fecha: string;
    monto: number;
    moneda: string;
    categoria: string;
    descripcion: string;
    cuenta?: string;
    noSumarBalance?: boolean;
    excluirDeCategorias?: boolean;
  }): Movimiento {
    const mov = this.manual.add(input);
    this.remountManual();
    return mov;
  }

  /** @deprecated use addManualMovimiento */
  addManualIngreso(input: {
    fecha: string;
    monto: number;
    moneda: string;
    categoria: string;
    descripcion: string;
    cuenta?: string;
  }): Movimiento {
    return this.addManualMovimiento({ ...input, tipo: 'ingreso' });
  }

  removeManual(id: string): boolean {
    const ok = this.manual.remove(id);
    if (ok) {
      this.remountManual();
    }
    return ok;
  }

  isManual(id: string): boolean {
    return this.manual.isManual(id);
  }

  getById(id: string): Movimiento | undefined {
    return this.snapshot.find((m) => m.id === id);
  }

  filter(opts: {
    mes?: string; // YYYY-MM
    tipo?: TipoMovimiento | 'todos';
    categoria?: string;
    search?: string;
  }): Movimiento[] {
    let list = [...this.snapshot];

    if (opts.mes) {
      list = list.filter((m) => m.fecha.startsWith(opts.mes!));
    }
    if (opts.tipo && opts.tipo !== 'todos') {
      list = list.filter((m) => m.tipo === opts.tipo);
    }
    if (opts.categoria && opts.categoria !== 'todas') {
      list = list.filter((m) => m.categoria === opts.categoria);
    }
    if (opts.search?.trim()) {
      const q = opts.search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.descripcion.toLowerCase().includes(q) ||
          m.categoria.toLowerCase().includes(q) ||
          m.banco.toLowerCase().includes(q) ||
          m.cuenta.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  resumenMes(mes: string): ResumenMes {
    const list = this.filter({ mes });
    const ingresos = list
      .filter((m) => m.tipo === 'ingreso' && !m.noSumarBalance)
      .reduce((s, m) => s + m.monto, 0);
    const egresos = list
      .filter((m) => m.tipo === 'egreso' && !m.noSumarBalance)
      .reduce((s, m) => s + m.monto, 0);
    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
      cantidad: list.length,
    };
  }

  topCategorias(mes: string, limit = 5): CategoriaResumen[] {
    const egresos = this.filter({ mes, tipo: 'egreso' }).filter(
      (m) => !m.excluirDeCategorias
    );
    const map = new Map<string, { total: number; cantidad: number }>();
    for (const m of egresos) {
      const cur = map.get(m.categoria) || { total: 0, cantidad: 0 };
      cur.total += m.monto;
      cur.cantidad += 1;
      map.set(m.categoria, cur);
    }
    const total = [...map.values()].reduce((s, v) => s + v.total, 0) || 1;
    return [...map.entries()]
      .map(([categoria, v]) => ({
        categoria,
        total: v.total,
        cantidad: v.cantidad,
        porcentaje: (v.total / total) * 100,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  categoriasDelMes(mes: string): CategoriaResumen[] {
    return this.topCategorias(mes, 50);
  }

  ultimos7Dias(): DiaResumen[] {
    const days: DiaResumen[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const fecha = this.toYmd(d);
      const label = d.toLocaleDateString('es-CL', { weekday: 'short' });
      const delDia = this.snapshot.filter((m) => m.fecha === fecha);
      days.push({
        fecha,
        label: label.replace('.', ''),
        ingresos: delDia
          .filter((m) => m.tipo === 'ingreso' && !m.noSumarBalance)
          .reduce((s, m) => s + m.monto, 0),
        egresos: delDia
          .filter((m) => m.tipo === 'egreso' && !m.noSumarBalance)
          .reduce((s, m) => s + m.monto, 0),
      });
    }
    return days;
  }

  listCategorias(): string[] {
    return [...new Set(this.snapshot.map((m) => m.categoria))].sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }

  listMesesDisponibles(): string[] {
    const set = new Set(this.snapshot.map((m) => m.fecha.slice(0, 7)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }

  mesActual(): string {
    return this.toYmd(new Date()).slice(0, 7);
  }

  /**
   * Google Sheets API v4 — listo para conectar.
   * Espera fila 1 con headers exactos del contrato documentado en README.
   */
  private async fetchFromGoogleSheets(cfg: AppConfig): Promise<Movimiento[]> {
    if (!cfg.apiKey?.trim()) {
      throw new Error(
        'Falta apiKey en config. Usa REPLACE_ME para modo mock o configura una API Key de Google Sheets.'
      );
    }

    const range = encodeURIComponent(`${cfg.sheetName}!A:L`);
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(cfg.spreadsheetId)}` +
      `/values/${range}?key=${encodeURIComponent(cfg.apiKey)}`;

    const res = await firstValueFrom(
      this.http.get<{ values?: string[][] }>(url)
    );
    const values = res.values || [];
    if (values.length < 2) {
      return [];
    }

    const headers = values[0].map((h) => String(h).trim().toLowerCase());
    const required = [
      'id',
      'fecha',
      'tipo',
      'monto',
      'moneda',
      'categoria',
      'descripcion',
      'banco',
      'cuenta',
      'fuente',
      'email_id',
      'synced_at',
    ];
    for (const col of required) {
      if (!headers.includes(col)) {
        throw new Error(`Columna faltante en Sheet: ${col}`);
      }
    }

    const idx = (name: string) => headers.indexOf(name);

    return values.slice(1)
      .filter((row) => row && row.length)
      .map((row) => {
        const tipoRaw = String(row[idx('tipo')] || '').toLowerCase();
        const fuenteRaw = String(row[idx('fuente')] || 'manual').toLowerCase();
        return {
          id: String(row[idx('id')] || crypto.randomUUID()),
          fecha: String(row[idx('fecha')] || ''),
          tipo: tipoRaw === 'ingreso' ? 'ingreso' : 'egreso',
          monto: Math.abs(Number(String(row[idx('monto')]).replace(/[^0-9.-]/g, '')) || 0),
          moneda: String(row[idx('moneda')] || 'CLP'),
          categoria: String(row[idx('categoria')] || 'Sin categoría'),
          descripcion: String(row[idx('descripcion')] || ''),
          banco: String(row[idx('banco')] || ''),
          cuenta: String(row[idx('cuenta')] || ''),
          fuente: fuenteRaw === 'email' ? 'email' : 'manual',
          email_id: String(row[idx('email_id')] || ''),
          synced_at: String(row[idx('synced_at')] || new Date().toISOString()),
        } as Movimiento;
      });
  }

  private cloneMock(): Movimiento[] {
    return MOCK_MOVIMIENTOS.map((m) => ({ ...m }));
  }

  private toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
