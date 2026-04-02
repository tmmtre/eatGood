package com.tommaso.backend.dto.request;

import com.tommaso.backend.model.enums.SectionCategory;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuSectionRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private SectionCategory category;
}
