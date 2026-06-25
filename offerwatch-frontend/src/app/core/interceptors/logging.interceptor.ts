import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { LoggerService } from '../services/logger.service';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);

  return next(req).pipe(
    tap({
      error: (err: unknown) => {
        if (!(err instanceof HttpErrorResponse)) return;

        const label = `${req.method} ${req.url}`;

        if (err.status === 0) {
          logger.error(`Network error on ${label} — API unreachable or CORS blocked`);
        } else {
          logger.warn(`HTTP ${err.status} on ${label}`);
        }
      },
    }),
  );
};
