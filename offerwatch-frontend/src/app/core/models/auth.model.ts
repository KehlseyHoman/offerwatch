export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Returned by POST /api/auth/login and /register.
 * The JWT is NOT here — it lives in an httpOnly cookie the browser manages
 * automatically.  expiresAt (epoch-ms) lets us check expiry client-side
 * without ever touching the token.
 */
export interface AuthResponse {
  userId: string;
  email:  string;
  name:   string;
  expiresAt: number;  // epoch milliseconds
}
