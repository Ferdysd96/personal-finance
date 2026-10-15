import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AppConfig } from '../models/movimiento.model';

const STORAGE_KEY = 'finanzas_config';

const DEFAULT_CONFIG: AppConfig = {
  spreadsheetId: 'REPLACE_ME',
  sheetName: 'Movimientos',
  apiKey: '',
};

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly config$ = new BehaviorSubject<AppConfig>({ ...DEFAULT_CONFIG });

  constructor(private readonly http: HttpClient) {}

  get snapshot(): AppConfig {
    return this.config$.value;
  }

  asObservable() {
    return this.config$.asObservable();
  }

  isUsingMock(): boolean {
    const id = (this.snapshot.spreadsheetId || '').trim();
    const key = (this.snapshot.apiKey || '').trim();
    return !id || id === 'REPLACE_ME' || !key;
  }

  async load(): Promise<AppConfig> {
    let fromAssets: Partial<AppConfig> = {};
    try {
      fromAssets = await firstValueFrom(this.http.get<AppConfig>('assets/config.json'));
    } catch {
      // assets opcionales
    }

    const fromStorage = this.readStorage();
    const merged: AppConfig = {
      ...DEFAULT_CONFIG,
      ...fromAssets,
      ...(fromStorage || {}),
    };

    // Si el storage viejo dejó apiKey/spreadsheetId vacíos, usa assets/config.json
    if (!(merged.apiKey || '').trim() && (fromAssets.apiKey || '').trim()) {
      merged.apiKey = fromAssets.apiKey as string;
    }
    if (
      (!(merged.spreadsheetId || '').trim() || merged.spreadsheetId === 'REPLACE_ME') &&
      (fromAssets.spreadsheetId || '').trim()
    ) {
      merged.spreadsheetId = fromAssets.spreadsheetId as string;
    }
    if (!(merged.sheetName || '').trim() && (fromAssets.sheetName || '').trim()) {
      merged.sheetName = fromAssets.sheetName as string;
    }

    this.config$.next(merged);
    this.writeStorage(merged);
    return merged;
  }

  async update(partial: Partial<AppConfig>): Promise<AppConfig> {
    const next = { ...this.snapshot, ...partial };
    this.config$.next(next);
    this.writeStorage(next);
    return next;
  }

  private readStorage(): AppConfig | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as AppConfig;
    } catch {
      return null;
    }
  }

  private writeStorage(cfg: AppConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {
      // ignore quota / private mode
    }
  }
}
