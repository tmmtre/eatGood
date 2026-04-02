package com.tommaso.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MenuItemResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        Boolean available,
        String imageUrl,
        LocalDateTime createdAt,
        Double averageRating,
        Long reviewCount
) {}
