package com.tommaso.backend.dto.response;

import com.tommaso.backend.model.enums.MealTime;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        int rating,
        String comment,
        String imageUrl,
        LocalDateTime createdAt,
        ReviewUserDto user,
        long likeCount,
        boolean likedByCurrentUser,
        MealTime mealTime,
        String itemName,
        String restaurantName,
        boolean anonymous
) {
    public record ReviewUserDto(String id, String firstName, String lastName) {}
}
