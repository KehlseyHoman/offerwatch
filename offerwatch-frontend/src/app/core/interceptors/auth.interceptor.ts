import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Attaches credentials (the httpOnly JWT cookie) to every request so the
 * browser sends it automatically, and catches 401 responses to auto-logout.
 *
 * withCredentials: true  → browser includes cookies on cross-origin requests
 *   (same-origin via the dev proxy, or production domain when deployed)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const credReq = req.clone({ withCredentials: true });

  return next(credReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Don't handle 401 on auth endpoints — avoids potential logout loops
      if (err.status === 401 && !req.url.includes('/auth/')) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
