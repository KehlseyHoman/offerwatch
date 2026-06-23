package com.offerwatch.io.service;

import com.offerwatch.io.dto.LoginRequest;
import com.offerwatch.io.dto.RegisterRequest;
import com.offerwatch.io.entity.User;
import com.offerwatch.io.repository.UserRepository;
import com.offerwatch.io.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Value("${google.client-id}")
    private String googleClientId;

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

    // ── Google Sign-In ────────────────────────────────────────────────────────

    @Transactional
    public AuthResult googleSignIn(String idTokenString) {
        Map<String, Object> payload = verifyGoogleToken(idTokenString);

        String email    = (String) payload.get("email");
        String name     = (String) payload.get("name");
        String googleId = (String) payload.get("sub");
        String aud      = (String) payload.get("aud");

        if (!googleClientId.equals(aud)) {
            throw new InvalidGoogleTokenException("Token audience mismatch");
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = User.builder()
                    .email(email)
                    .name(name != null ? name : email)
                    .googleId(googleId)
                    .build();
        } else if (user.getGoogleId() == null) {
            user.setGoogleId(googleId);
        }

        user = userRepository.save(user);
        return buildResult(user);
    }

    private Map<String, Object> verifyGoogleToken(String idTokenString) {
        try {
            return RestClient.create()
                    .get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token={token}", idTokenString)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            throw new InvalidGoogleTokenException("Google token validation failed");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResult buildResult(User user) {
        long expiresAt = System.currentTimeMillis() + jwtUtil.getExpirationMs();
        String token   = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResult(token, expiresAt, user.getId(), user.getEmail(), user.getName());
    }

    // ── Custom exceptions ─────────────────────────────────────────────────────

    public static class EmailAlreadyUsedException extends RuntimeException {
        public EmailAlreadyUsedException(String message) { super(message); }
    }

    public static class InvalidGoogleTokenException extends RuntimeException {
        public InvalidGoogleTokenException(String message) { super(message); }
    }
}
