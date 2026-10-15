export type TipoMovimiento = 'ingreso' | 'egreso';
export type FuenteMovimiento = 'email' | 'manual';

export interface Movimiento {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  monto: number;
  moneda: string;
  categoria: string;
  descripcion: string;
  banco: string;
  cuenta: string;
  fuente: FuenteMovimiento;
  email_id: string;
  synced_at: string;
  /** Si true, no entra al balance / egresos del resumen (gasto con efectivo ya retirado). */
  noSumarBalance?: boolean;
  /** Si true, no entra al desglose por categorías (p.ej. retiro de efectivo). */
  excluirDeCategorias?: boolean;
}

export interface AppConfig {
  spreadsheetId: string;
  sheetName: string;
  apiKey: string;
}

export interface ResumenMes {
  ingresos: number;
  egresos: number;
  balance: number;
  cantidad: number;
}

export interface CategoriaResumen {
  categoria: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

export interface DiaResumen {
  fecha: string;
  label: string;
  ingresos: number;
  egresos: number;
}
