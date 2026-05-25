package com.offerwatch.io.service;

import com.offerwatch.io.dto.AuthResponse;
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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyUsedException("Email already registered: " + request.email());
        }

        User user = User.builder()
                .email(request.email())
                .name(request.name())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getName());
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        // Throws BadCredentialsException if email/password don't match
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalStateException("User vanished after auth"));

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getName());
    }

    // ── Custom exception ──────────────────────────────────────────────────────

    public static class EmailAlreadyUsedException extends RuntimeException {
        public EmailAlreadyUsedException(String message) { super(message); }
    }
}
