package com.tommaso.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record MenuSectionResponse(
        Long id,
        String name,
        LocalDateTime createdAt,
        List<MenuItemResponse> items
) {}
