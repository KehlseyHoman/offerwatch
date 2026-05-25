import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

const TOKEN_KEY  = 'ow_token';
const USER_KEY   = 'ow_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _authResponse = signal<AuthResponse | null>(this.loadFromStorage());

  readonly isLoggedIn  = computed(() => this._authResponse() !== null);
  readonly currentUser = computed(() => this._authResponse());
  readonly token       = computed(() => this._authResponse()?.token ?? null);

  /** Decode the JWT exp claim and check if it has passed. */
  isTokenExpired(): boolean {
    const t = this.token();
    if (!t) return true;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return Date.now() >= payload.exp * 1000;   // exp is in seconds
    } catch {
      return true;   // malformed token → treat as expired
    }
  }

  /** Clear session data without navigating — used by the auth guard. */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._authResponse.set(null);
  }

  constructor(private http: HttpClient, private router: Router) {}

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, req)
      .pipe(tap(res => this.persist(res)));
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, req)
      .pipe(tap(res => this.persist(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._authResponse.set(null);
    this.router.navigate(['/login']);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
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
