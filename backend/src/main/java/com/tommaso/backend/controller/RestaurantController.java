package com.tommaso.backend.controller;

import com.tommaso.backend.dto.request.RestaurantRequest;
import com.tommaso.backend.dto.response.RestaurantResponse;
import com.tommaso.backend.mapper.RestaurantMapper;
import com.tommaso.backend.model.Restaurant;
import com.tommaso.backend.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final RestaurantMapper restaurantMapper;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RestaurantResponse>> getByUser(@PathVariable String userId) {
        List<Restaurant>  restaurants = restaurantService.findByUserId(userId);
        List<RestaurantResponse> response = restaurants.stream()
                .map(restaurantMapper)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantMapper.apply(restaurantService.findById(id)));
    }

    @PostMapping("/user/{userId}")
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        restaurantService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
