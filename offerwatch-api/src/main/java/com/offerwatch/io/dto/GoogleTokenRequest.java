package com.offerwatch.io.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleTokenRequest(
        @NotBlank String idToken
) {}
