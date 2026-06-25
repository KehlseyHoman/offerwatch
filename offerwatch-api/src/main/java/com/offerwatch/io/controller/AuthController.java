package com.offerwatch.io.controller;

import com.offerwatch.io.dto.AuthResponse;
import com.offerwatch.io.dto.GoogleTokenRequest;
import com.offerwatch.io.dto.LoginRequest;
import com.offerwatch.io.dto.RegisterRequest;
import com.offerwatch.io.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** true in production (HTTPS); false for local HTTP dev */
    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    // ── Register ──────────────────────────────────────────────────────────────

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request,
                                 HttpServletResponse response) {
        AuthService.AuthResult result = authService.register(request);
        setJwtCookie(response, result.token(), result.expiresAt());
        return new AuthResponse(result.userId(), result.email(), result.name(), result.expiresAt());
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request,
                              HttpServletResponse response) {
        AuthService.AuthResult result = authService.login(request);
        setJwtCookie(response, result.token(), result.expiresAt());
        return new AuthResponse(result.userId(), result.email(), result.name(), result.expiresAt());
    }

    // ── Google Sign-In ────────────────────────────────────────────────────────

    @PostMapping("/google")
    public AuthResponse googleSignIn(@Valid @RequestBody GoogleTokenRequest request,
                                     HttpServletResponse response) {
        AuthService.AuthResult result = authService.googleSignIn(request.idToken());
        setJwtCookie(response, result.token(), result.expiresAt());
        return new AuthResponse(result.userId(), result.email(), result.name(), result.expiresAt());
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    /** Clears the JWT cookie by setting it to an empty value with maxAge=0. */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletResponse response) {
        ResponseCookie cleared = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSecure ? "None" : "Lax")
                .path("/api")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cleared.toString());
    }

    // ── Cookie helper ─────────────────────────────────────────────────────────

    private void setJwtCookie(HttpServletResponse response, String token, long expiresAt) {
        long maxAgeSeconds = Math.max(0, (expiresAt - System.currentTimeMillis()) / 1000);
        // SameSite=None is required in production where the frontend and API are on
        // different subdomains — Lax blocks cookies on cross-origin AJAX requests.
        // SameSite=None requires Secure=true, which is already enforced by cookieSecure.
        String sameSite = cookieSecure ? "None" : "Lax";
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(sameSite)
                .path("/api")
                .maxAge(maxAgeSeconds)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // ── Exception handlers ────────────────────────────────────────────────────

    @ExceptionHandler(AuthService.EmailAlreadyUsedException.class)
    public ResponseEntity<ProblemDetail> handleEmailTaken(AuthService.EmailAlreadyUsedException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ProblemDetail> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ProblemDetail.forStatusAndDetail(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password."));
    }

    @ExceptionHandler(AuthService.InvalidGoogleTokenException.class)
    public ResponseEntity<ProblemDetail> handleInvalidGoogleToken(AuthService.InvalidGoogleTokenException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Google sign-in failed."));
    }
}
