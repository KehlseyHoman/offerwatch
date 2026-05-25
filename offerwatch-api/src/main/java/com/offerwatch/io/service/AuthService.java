package com.offerwatch.io.service;

import com.offerwatch.io.dto.LoginRequest;
import com.offerwatch.io.dto.RegisterRequest;
import com.offerwatch.io.entity.User;
import com.offerwatch.io.repository.UserRepository;
import com.offerwatch.io.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    /**
     * Internal result — contains the raw JWT so the controller can set it
     * as an httpOnly cookie.  The token is never sent to the client in a body.
     */
    public record AuthResult(String token, long expiresAt, UUID userId, String email, String name) {}

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyUsedException("Email already registered: " + request.email());
        }

        User user = User.builder()
                .email(request.email())
                .name(request.name())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        user = userRepository.save(user);
        return buildResult(user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public AuthResult login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalStateException("User vanished after auth"));

        return buildResult(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResult buildResult(User user) {
        long expiresAt = System.currentTimeMillis() + jwtUtil.getExpirationMs();
        String token   = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResult(token, expiresAt, user.getId(), user.getEmail(), user.getName());
    }

    // ── Custom exception ──────────────────────────────────────────────────────

    public static class EmailAlreadyUsedException extends RuntimeException {
        public EmailAlreadyUsedException(String message) { super(message); }
    }
}
