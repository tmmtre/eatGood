package com.tommaso.backend.controller;

import com.tommaso.backend.dto.request.MenuSectionRequest;
import com.tommaso.backend.dto.response.MenuSectionResponse;
import com.tommaso.backend.mapper.MenuSectionMapper;
import com.tommaso.backend.model.MenuSection;
import com.tommaso.backend.service.MenuSectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/sections")
@RequiredArgsConstructor
public class MenuSectionController {

    private final MenuSectionService menuSectionService;
    private final MenuSectionMapper menuSectionMapper;

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<MenuSectionResponse>> getByRestaurant(
            @PathVariable Long restaurantId) {
        List<MenuSection> sections = menuSectionService.findByRestaurantId(restaurantId);
        List<MenuSectionResponse> response = sections.stream()
                .map(menuSectionMapper)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasRole('ADMIN') or @restaurantSecurity.isOwner(#restaurantId, authentication)")
    public ResponseEntity<MenuSectionResponse> create(
            @PathVariable Long restaurantId,
            @RequestBody @Valid MenuSectionRequest request) {
        MenuSection section = MenuSection.builder()
                .name(request.getName())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(menuSectionMapper.apply(menuSectionService.create(restaurantId, section)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<MenuSectionResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid MenuSectionRequest request) {
        MenuSection section = MenuSection.builder()
                .name(request.getName())
                .build();
        return ResponseEntity.ok(menuSectionMapper.apply(menuSectionService.update(id, section)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<MenuSectionResponse> delete(@PathVariable Long id) {
        menuSectionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
