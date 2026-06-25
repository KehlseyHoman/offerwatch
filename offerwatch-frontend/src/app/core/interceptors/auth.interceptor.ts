import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const logger = inject(LoggerService);

  const credReq = req.clone({ withCredentials: true });

  return next(credReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        if (req.url.includes('/auth/')) {
          logger.warn(`authInterceptor: 401 on auth endpoint ${req.url} — not logging out`);
        } else {
          logger.warn(`authInterceptor: 401 on ${req.url} — logging out`);
          auth.logout();
        }
      }
      return throwError(() => err);
    }),
  );
};
