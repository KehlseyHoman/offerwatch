package com.offerwatch.io.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Intercepts every request, looks for a Bearer token in the Authorization header,
 * validates it via {@link JwtUtil}, and sets the authenticated principal in the
 * {@link SecurityContextHolder} so downstream code can call
 * {@code authentication.getName()} to get the userId.
 *
 * Requests without a valid token pass through unauthenticated — Spring Security
 * then rejects them if the route requires authentication.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // strip "Bearer "

        if (!jwtUtil.isValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Token is valid — build an authenticated principal from it (no DB call needed)
        UUID userId = jwtUtil.extractUserId(token);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        userId.toString(),   // principal  → controllers call auth.getName()
                        null,                // credentials (not needed after token validation)
                        List.of()            // authorities (roles — extend when needed)
                );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }
}
