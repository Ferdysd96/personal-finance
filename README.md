# Finanzas

App móvil de finanzas personales construida con **Ionic + Angular + Capacitor**.
Interfaz en español, tema oscuro premium con acentos teal/emerald.

El MVP funciona **100% offline** con datos mock realistas (estilo bancos chilenos en CLP).
La capa `SheetsService` está preparada para conectar Google Sheets API v4.

## Requisitos

- Node.js 20+ (probado con v24.18.0)
- npm 10+

## Cómo ejecutar

```bash
cd C:\Users\ferdys\Desktop\finanzas-app
npm install
npx ionic serve
# o
npm start
```

Luego abre la URL que imprime la consola (normalmente http://localhost:8100).

### Build de producción

```bash
npm run build
# salida en www/ (Capacitor webDir)
```

### Capacitor (nativo)

```bash
npx cap add android   # o ios en macOS
npx ionic build
npx cap sync
npx cap open android
```

## Pantallas

| Ruta | Descripción |
|------|-------------|
| Inicio | Balance del mes, ingresos/egresos, gráfico últimos 7 días, top categorías, recientes |
| Movimientos | Lista filtrable (mes, tipo, categoría, búsqueda) con montos verdes/rojos |
| Detalle | Ficha completa de un movimiento |
| Categorías | Desglose del mes + gráfico doughnut |
| Ajustes | spreadsheetId, refresh, última sync, acerca de |

## Contrato Google Sheet (bot de finanzas)

Pestaña: **`Movimientos`**

Fila 1 (headers exactos, en este orden):

```
id | fecha | tipo | monto | moneda | categoria | descripcion | banco | cuenta | fuente | email_id | synced_at
```

### Reglas de columnas

| Columna | Formato / valores |
|---------|------------------|
| `id` | Identificador único del movimiento |
| `fecha` | `YYYY-MM-DD` |
| `tipo` | `ingreso` | `egreso` |
| `monto` | Número positivo |
| `moneda` | Por defecto `CLP` |
| `categoria` | Texto libre (ej. Supermercado, Sueldo) |
| `descripcion` | Texto |
| `banco` | Nombre del banco |
| `cuenta` | Cuenta enmascarada u otro identificador |
| `fuente` | `email` | `manual` |
| `email_id` | ID del correo origen (vacío si manual) |
| `synced_at` | Timestamp ISO de sincronización |

Este contrato es el que debe respetar el **finance bot** al escribir filas en el Sheet.

## Configuración

Archivo: `src/assets/config.json`

```json
{
  "spreadsheetId": "REPLACE_ME",
  "sheetName": "Movimientos",
  "apiKey": ""
}
```

- Si `spreadsheetId` es `REPLACE_ME` (o vacío) → se usan **~21 movimientos mock**.
- También puedes editar el ID desde **Ajustes** (se guarda en `localStorage`).

### Cómo conectar un Sheet real

1. Crea un Google Sheet con la pestaña `Movimientos` y los headers del contrato.
2. En [Google Cloud Console](https://console.cloud.google.com/) habilita **Google Sheets API** y crea una **API Key**.
3. Comparte el Sheet como lectura pública (o restringe por API key / OAuth según tu política).
4. Edita `src/assets/config.json`:

```json
{
  "spreadsheetId": "TU_SPREADSHEET_ID",
  "sheetName": "Movimientos",
  "apiKey": "TU_API_KEY"
}
```

5. **No subas la API Key al repositorio.** Usa variables de entorno / secretos locales o deja `apiKey` vacío en git y pégala solo en tu máquina.
6. Reinicia la app o pulsa **Actualizar ahora** en Ajustes.

La lógica vive en `src/app/services/sheets.service.ts` → método `fetchFromGoogleSheets`.

## Estructura del proyecto

```
src/
  assets/config.json          # Config Sheet (sin secretos en git)
  app/
    models/                   # Tipos Movimiento / resúmenes
    services/
      sheets.service.ts       # Abstracción Sheets + mock
      config.service.ts       # Carga config + localStorage
      mock-data.ts            # Datos de demostración CLP
    pipes/moneda.pipe.ts      # Formato es-CL / CLP
    tabs/                     # Tab bar
    inicio/                   # Dashboard
    movimientos/              # Lista + filtros
    detalle/                  # Detalle movimiento
    categorias/               # Breakdown mes
    ajustes/                  # Configuración
```

## Stack

- Ionic 9 + Angular 22 (NgModules / lazy)
- Capacitor 8
- Chart.js (barras + doughnut)
- date-fns (disponible; helpers nativos en servicios)

## Notas de seguridad

- No commits de `apiKey`, tokens ni credenciales.
- `src/assets/config.json` debe quedar con `apiKey: ""` en el repo.
- El modo mock no llama a Google.

## Licencia

Proyecto de uso personal / demo.
