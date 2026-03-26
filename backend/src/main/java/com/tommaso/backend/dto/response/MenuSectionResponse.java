package com.tommaso.backend.dto.response;

import java.time.LocalDateTime;

public record MenuSectionResponse(
        Long id,
        String name,
        LocalDateTime createdAt
) {}
