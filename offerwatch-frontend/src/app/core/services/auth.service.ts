import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, GoogleSignInRequest, LoginRequest, RegisterRequest } from '../models/auth.model';
import { LoggerService } from './logger.service';

const USER_KEY = 'ow_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _authResponse: WritableSignal<AuthResponse | null>;

  readonly isLoggedIn  = computed(() => this._authResponse() !== null);
  readonly currentUser = computed(() => this._authResponse());

  constructor(private http: HttpClient, private router: Router, private logger: LoggerService) {
    this._authResponse = signal(this.loadFromStorage());
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, req, { withCredentials: true })
      .pipe(tap(res => {
        this.logger.info(`AuthService: registered, session expires ${new Date(res.expiresAt).toISOString()}`);
        this.persist(res);
      }));
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, req, { withCredentials: true })
      .pipe(tap(res => {
        this.logger.info(`AuthService: logged in, session expires ${new Date(res.expiresAt).toISOString()}`);
        this.persist(res);
      }));
  }

  googleSignIn(idToken: string): Observable<AuthResponse> {
    const req: GoogleSignInRequest = { idToken };
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/google`, req, { withCredentials: true })
      .pipe(tap(res => {
        this.logger.info(`AuthService: Google sign-in, session expires ${new Date(res.expiresAt).toISOString()}`);
        this.persist(res);
      }));
  }

  logout(): void {
    this.logger.info('AuthService: logging out');
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe();
    this.clearSession();
    this.router.navigate(['/login']);
  }

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
      if (!raw) return null;
      const session: AuthResponse = JSON.parse(raw);
      const expired = Date.now() >= session.expiresAt;
      this.logger.info(`AuthService: restored session, expired: ${expired}, expiresAt: ${new Date(session.expiresAt).toISOString()}`);
      return session;
    } catch {
      this.logger.warn('AuthService: failed to parse stored session, clearing');
      return null;
    }
  }
}
