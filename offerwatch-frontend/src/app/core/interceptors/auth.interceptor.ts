import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Two responsibilities:
 *  1. Attach the JWT Bearer token to every outgoing request.
 *  2. Catch 401 responses (expired / invalid token) and auto-logout so the
 *     user is immediately sent to the login page instead of seeing API errors.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.token();

  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // Token was rejected by the server — clear session and redirect
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
