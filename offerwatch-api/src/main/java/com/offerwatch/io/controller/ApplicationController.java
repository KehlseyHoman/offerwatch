package com.offerwatch.io.controller;

import com.offerwatch.io.entity.Application;
import com.offerwatch.io.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for job applications.
 * Base path: /api/applications
 *
 * All routes require a valid JWT (enforced by SecurityConfig).
 * The authenticated user's ID is extracted from the token via
 * {@code Authentication.getName()} — no userId query param needed.
 *
 * Endpoints:
 *   GET    /api/applications           – list all for the logged-in user
 *   GET    /api/applications/{id}      – get one (must be owned by caller)
 *   POST   /api/applications           – create
 *   PATCH  /api/applications/{id}      – partial update
 *   DELETE /api/applications/{id}      – delete
 */
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping
    public List<Application> getAll(Authentication auth) {
        return applicationService.getAllForUser(userId(auth));
    }

    @GetMapping("/{id}")
    public Application getOne(@PathVariable UUID id, Authentication auth) {
        return applicationService.getByIdForUser(id, userId(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Application create(@Valid @RequestBody Application application, Authentication auth) {
        try {
            return applicationService.create(application, userId(auth));
        } catch (ApplicationService.FreeTierLimitException ex) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, ex.getMessage());
        }
    }

    @PatchMapping("/{id}")
    public Application update(@PathVariable UUID id,
                              @RequestBody Application patch,
                              Authentication auth) {
        return applicationService.update(id, patch, userId(auth));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, Authentication auth) {
        applicationService.delete(id, userId(auth));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /** Extracts the userId UUID from the JWT principal set by {@link com.offerwatch.io.security.JwtAuthFilter}. */
    private UUID userId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
