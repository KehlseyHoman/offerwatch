package com.offerwatch.io.dto;

import java.util.UUID;

/**
 * Returned in the response body after login / register.
 * The JWT itself is NOT included here — it lives in an httpOnly cookie
 * that the server sets automatically and the browser manages invisibly.
 */
public record AuthResponse(
        UUID userId,
        String email,
        String name,
        long expiresAt   // epoch-ms — lets the client show a session countdown if desired
) {}
