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
        return ResponseEntity.ok(menuSectionService.findByRestaurantId(restaurantId));  // ← simplified
    }

    @PostMapping("/restaurant/{restaurantId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MenuSectionResponse> create(
            @PathVariable Long restaurantId,
            @RequestBody @Valid MenuSectionRequest request) {
        MenuSection section = MenuSection.builder()
                .name(request.getName())
                .category(request.getCategory())
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
                .category(request.getCategory())
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
