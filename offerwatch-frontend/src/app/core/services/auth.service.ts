import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

const USER_KEY = 'ow_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _authResponse = signal<AuthResponse | null>(this.loadFromStorage());

  readonly isLoggedIn  = computed(() => this._authResponse() !== null);
  readonly currentUser = computed(() => this._authResponse());

  constructor(private http: HttpClient, private router: Router) {}

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, req, { withCredentials: true })
      .pipe(tap(res => this.persist(res)));
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, req, { withCredentials: true })
      .pipe(tap(res => this.persist(res)));
  }

  logout(): void {
    // Tell the server to clear the httpOnly cookie (best-effort; clear locally regardless)
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe();
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Check expiry using the timestamp stored alongside the user info.
   * No JWT decoding needed - the server told us when it expires at login time.
   */
  isTokenExpired(): boolean {
    const user = this._authResponse();
    if (!user) return true;
    return Date.now() >= user.expiresAt;
  }

  /** Wipe localStorage + in-memory state without navigating (used by auth guard). */
  clearSession(): void {
    localStorage.removeItem(USER_KEY);
    this._authResponse.set(null);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(USER_KEY, JSON.stringify(res));
    this._authResponse.set(res);
  }

  private loadFromStorage(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
