package com.tommaso.backend.mapper;

import com.tommaso.backend.dto.response.MenuSectionResponse;
import com.tommaso.backend.model.MenuSection;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
public class MenuSectionMapper implements Function<MenuSection, MenuSectionResponse> {

    @Override
    public MenuSectionResponse apply(MenuSection s) {
        return new MenuSectionResponse(
                s.getId(),
                s.getName(),
                s.getCreatedAt()
        );
    }
}
