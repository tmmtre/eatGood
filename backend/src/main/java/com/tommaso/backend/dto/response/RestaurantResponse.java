package com.tommaso.backend.dto.response;

import java.time.LocalDateTime;

public record RestaurantResponse(
        Long id,
        String name,
        String description,
        String address,
        String city,
        String status,
        LocalDateTime createdAt,
        UserSummary user
) {
    public record UserSummary(String id, String email, String firstName, String lastName) {}
}
