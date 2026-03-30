package com.tommaso.backend.controller;

import com.tommaso.backend.dto.request.RestaurantRequest;
import com.tommaso.backend.dto.response.RestaurantResponse;
import com.tommaso.backend.mapper.RestaurantMapper;
import com.tommaso.backend.model.Restaurant;
import com.tommaso.backend.model.enums.RestaurantStatus;
import com.tommaso.backend.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final RestaurantMapper restaurantMapper;

    @GetMapping("/approved")
    public ResponseEntity<List<RestaurantResponse>> getApproved() {
        return ResponseEntity.ok(
                restaurantService.findByStatus(RestaurantStatus.APPROVED)
                        .stream().map(restaurantMapper).toList()
        );
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<RestaurantResponse>> getByUser(@PathVariable String userId) {
        return ResponseEntity.ok(
                restaurantService.findByUserId(userId)
                        .stream().map(restaurantMapper).toList()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantMapper.apply(restaurantService.findById(id)));
    }

    @PostMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RestaurantResponse> create(
            @PathVariable String userId,
            @RequestBody @Valid RestaurantRequest request) {
        Restaurant restaurant = Restaurant.builder()
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(restaurantMapper.apply(restaurantService.create(userId, restaurant)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @restaurantSecurity.isOwner(#id, authentication)")
    public ResponseEntity<RestaurantResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid RestaurantRequest request) {
        Restaurant updated = Restaurant.builder()
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .build();
        return ResponseEntity.ok(restaurantMapper.apply(restaurantService.update(id, updated)));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RestaurantResponse>> getAll() {
        return ResponseEntity.ok(
                restaurantService.findAll()
                        .stream().map(restaurantMapper).toList()
        );
    }

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RestaurantResponse>> getPending() {
        return ResponseEntity.ok(
                restaurantService.findByStatus(RestaurantStatus.PENDING)
                        .stream().map(restaurantMapper).toList()
        );
    }

    @PutMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RestaurantResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantMapper.apply(restaurantService.approve(id)));
    }

    @PutMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RestaurantResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantMapper.apply(restaurantService.decline(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @restaurantSecurity.isOwner(#id, authentication)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        restaurantService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
