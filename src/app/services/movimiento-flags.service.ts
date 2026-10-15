import { Injectable } from '@angular/core';

export interface MovimientoFlags {
  noSumarBalance?: boolean;
  excluirDeCategorias?: boolean;
}

const STORAGE_KEY = 'finanzas_movimiento_flags';

@Injectable({ providedIn: 'root' })
export class MovimientoFlagsService {
  private readAll(): Record<string, MovimientoFlags> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private writeAll(map: Record<string, MovimientoFlags>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  get(id: string): MovimientoFlags {
    return this.readAll()[id] || {};
  }

  set(id: string, patch: MovimientoFlags): MovimientoFlags {
    const all = this.readAll();
    const next: MovimientoFlags = { ...(all[id] || {}), ...patch };
    if (next.noSumarBalance === undefined) delete next.noSumarBalance;
    if (next.excluirDeCategorias === undefined) delete next.excluirDeCategorias;
    if (!Object.keys(next).length) {
      delete all[id];
    } else {
      all[id] = next;
    }
    this.writeAll(all);
    return next;
  }

  clear(id: string): void {
    const all = this.readAll();
    delete all[id];
    this.writeAll(all);
  }
}

/** Detecta retiros/avances de efectivo del banco. */
export function esRetiroEfectivo(categoria: string, descripcion: string): boolean {
  const t = ((categoria || '') + ' ' + (descripcion || '')).toLowerCase();
  return /retiro|efectivo|cajero|\batm\b|avance\s*de\s*efectivo|cash\s*advance/.test(t);
}
