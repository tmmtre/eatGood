package com.tommaso.backend.controller;

import com.tommaso.backend.dto.request.MenuSectionRequest;
import com.tommaso.backend.dto.response.MenuSectionResponse;
import com.tommaso.backend.model.MenuSection;
import com.tommaso.backend.service.MenuSectionService;
import com.tommaso.backend.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/sections")
@RequiredArgsConstructor
public class MenuSectionController {

    private final MenuSectionService menuSectionService;

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<MenuSectionResponse>> getByRestaurant(
            @PathVariable Long restaurantId) {
        List<MenuSection> sections = menuSectionService.findByRestaurantId(restaurantId);
        List<MenuSectionResponse> response = sections.stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<MenuSectionResponse> create(
            @PathVariable Long restaurantId,
            @RequestBody @Valid MenuSectionRequest request) {
        MenuSection section = MenuSection.builder()
                .name(request.getName())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(menuSectionService.create(restaurantId, section)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuSectionResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid MenuSectionRequest request) {
        MenuSection section = MenuSection.builder()
                .name(request.getName())
                .build();
        return ResponseEntity.ok(toResponse(menuSectionService.update(id, section)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MenuSectionResponse> delete(@PathVariable Long id) {
        menuSectionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private MenuSectionResponse toResponse(MenuSection s) {
        return MenuSectionResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
