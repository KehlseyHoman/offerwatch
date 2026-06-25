import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

export const authGuard: CanActivateFn = (route) => {
  const auth   = inject(AuthService);
  const logger = inject(LoggerService);

  if (auth.isLoggedIn() && !auth.isTokenExpired()) return true;

  const reason = !auth.isLoggedIn() ? 'no session' : 'token expired';
  logger.warn(`authGuard: redirecting to login — ${reason} (attempted: /${route.url})`);
  auth.clearSession();
  return inject(Router).createUrlTree(['/login']);
};
