package com.offerwatch.io.controller;

import com.offerwatch.io.dto.AuthResponse;
import com.offerwatch.io.dto.LoginRequest;
import com.offerwatch.io.dto.RegisterRequest;
import com.offerwatch.io.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** POST /api/auth/register */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    /** POST /api/auth/login */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // ── Exception handlers scoped to this controller ──────────────────────────

    @ExceptionHandler(AuthService.EmailAlreadyUsedException.class)
    public ResponseEntity<ProblemDetail> handleEmailTaken(AuthService.EmailAlreadyUsedException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ProblemDetail> handleBadCredentials(BadCredentialsException ex) {
        // Generic message — don't reveal whether the email exists
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ProblemDetail.forStatusAndDetail(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password."));
    }
}
