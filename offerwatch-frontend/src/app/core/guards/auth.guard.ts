import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  // Token exists AND hasn't expired → allow navigation
  if (auth.isLoggedIn() && !auth.isTokenExpired()) return true;

  // Otherwise wipe the stale localStorage entry and redirect to login
  auth.clearSession();
  return inject(Router).createUrlTree(['/login']);
};
