package com.tommaso.backend.dto.response;

import java.time.LocalDateTime;

public record UserResponse(
        String id,
        String firstName,
        String lastName,
        String email,
        String role,
        Boolean emailVerified,
        String profileImageUrl,
        LocalDateTime createdAt
) {}
