package com.tommaso.backend.dto.response;

import com.tommaso.backend.model.enums.SectionCategory;
import java.time.LocalDateTime;
import java.util.List;

public record MenuSectionResponse(
        Long id,
        String name,
        SectionCategory category,
        LocalDateTime createdAt,
        List<MenuItemResponse> items
) {}
