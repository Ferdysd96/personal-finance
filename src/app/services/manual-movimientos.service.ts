import { Injectable } from '@angular/core';
import { Movimiento, TipoMovimiento } from '../models/movimiento.model';

const STORAGE_KEY = 'finanzas_manual_movimientos';

@Injectable({ providedIn: 'root' })
export class ManualMovimientosService {
  list(): Movimiento[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter((m) => m && typeof m === 'object' && m.id) as Movimiento[];
    } catch {
      return [];
    }
  }

  saveAll(items: Movimiento[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  add(input: {
    tipo: TipoMovimiento;
    fecha: string;
    monto: number;
    moneda: string;
    categoria: string;
    descripcion: string;
    cuenta?: string;
    noSumarBalance?: boolean;
    excluirDeCategorias?: boolean;
  }): Movimiento {
    const tipo: TipoMovimiento = input.tipo === 'egreso' ? 'egreso' : 'ingreso';
    const id = `manual_${Date.now()}`;
    const defaultCat = tipo === 'ingreso' ? 'ingreso' : 'gasto';
    const mov: Movimiento = {
      id,
      fecha: input.fecha,
      tipo,
      monto: Math.abs(Number(input.monto) || 0),
      moneda: input.moneda || 'DOP',
      categoria: (input.categoria || defaultCat).trim() || defaultCat,
      descripcion: input.descripcion.trim(),
      banco: 'Manual',
      cuenta: (input.cuenta || '').trim(),
      fuente: 'manual',
      email_id: id,
      synced_at: new Date().toISOString(),
      noSumarBalance: !!input.noSumarBalance,
      excluirDeCategorias: !!input.excluirDeCategorias,
    };
    const list = this.list();
    list.push(mov);
    this.saveAll(list);
    return mov;
  }

  remove(id: string): boolean {
    const list = this.list();
    const next = list.filter((m) => m.id !== id);
    if (next.length === list.length) {
      return false;
    }
    this.saveAll(next);
    return true;
  }

  isManual(id: string): boolean {
    return id.startsWith('manual_') || this.list().some((m) => m.id === id);
  }
}
