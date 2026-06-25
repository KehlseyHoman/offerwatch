import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly dev = !environment.production;

  info(message: string): void {
    if (this.dev) console.info(`[INFO] ${message}`);
  }

  warn(message: string): void {
    if (this.dev) console.warn(`[WARN] ${message}`);
  }

  error(message: string, err?: unknown): void {
    if (this.dev) console.error(`[ERROR] ${message}`, err ?? '');
  }
}
