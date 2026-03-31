package com.tommaso.backend.mapper;

import com.tommaso.backend.dto.response.MenuItemResponse;
import com.tommaso.backend.dto.response.MenuSectionResponse;
import com.tommaso.backend.model.MenuSection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Function;

@Component
@RequiredArgsConstructor
public class MenuSectionMapper implements Function<MenuSection, MenuSectionResponse> {

    private final MenuItemMapper menuItemMapper;

    @Override
    public MenuSectionResponse apply(MenuSection s) {
        List<MenuItemResponse> items = s.getItems() == null
                ? List.of()
                : s.getItems().stream().map(menuItemMapper).toList();

        return new MenuSectionResponse(
                s.getId(),
                s.getName(),
                s.getCreatedAt(),
                items
        );
    }
}
