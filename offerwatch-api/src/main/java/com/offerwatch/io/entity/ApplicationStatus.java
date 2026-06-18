package com.offerwatch.io.entity;

/**
 * Mirrors the PostgreSQL enum `application_status`.
 * Values are lowercase to match the DB enum literals exactly —
 * @Enumerated(EnumType.STRING) writes the name() directly.
 */
public enum ApplicationStatus {
    saved,
    applied,
    phone_screen,
    technical_interview,
    final_round,
    offer,
    rejected
}
