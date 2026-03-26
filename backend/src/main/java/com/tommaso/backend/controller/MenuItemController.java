package com.tommaso.backend.controller;

import com.tommaso.backend.dto.request.MenuItemRequest;
import com.tommaso.backend.dto.response.MenuItemResponse;
import com.tommaso.backend.mapper.MenuItemMapper;
import com.tommaso.backend.model.MenuItem;
import com.tommaso.backend.service.MenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/items")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;
    private final MenuItemMapper menuItemMapper;

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<List<MenuItemResponse>> getBySection(
            @PathVariable Long sectionId) {
        return ResponseEntity.ok(
                menuItemService.findBySectionId(sectionId).stream()
                        .map(menuItemMapper)
                        .toList()
        );
    }

    @PostMapping(value = "/section/{sectionId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemResponse> create(
            @PathVariable Long sectionId,
            @RequestPart("item") @Valid MenuItemRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image)
            throws IOException {
        MenuItem item = MenuItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .available(request.getAvailable())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(menuItemMapper.apply(menuItemService.create(sectionId, item, image)));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemResponse> update(
            @PathVariable Long id,
            @RequestPart("item") @Valid MenuItemRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image)
            throws IOException {
        MenuItem updated = MenuItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .available(request.getAvailable())
                .build();
        return ResponseEntity.ok(menuItemMapper.apply(menuItemService.update(id, updated, image)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        menuItemService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
