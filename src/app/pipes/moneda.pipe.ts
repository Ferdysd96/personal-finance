import { Pipe, PipeTransform } from '@angular/core';

/** Formato: miles con coma, decimales con punto (ej. 1,234.56). */
@Pipe({ name: 'monedaCl', standalone: false })
export class MonedaPipe implements PipeTransform {
  transform(value: number | null | undefined, moneda = 'DOP'): string {
    if (value == null || isNaN(Number(value))) {
      return '—';
    }
    const code = (moneda || 'DOP').toUpperCase();
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value));
    } catch {
      return (
        Number(value).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) +
        ' ' +
        code
      );
    }
  }
}
