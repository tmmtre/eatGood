package com.tommaso.backend.service;

import com.tommaso.backend.model.Restaurant;
import com.tommaso.backend.model.User;
import com.tommaso.backend.model.enums.RestaurantStatus;
import com.tommaso.backend.model.enums.Role;
import com.tommaso.backend.repository.RestaurantRepository;
import com.tommaso.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public List<Restaurant> findByUserId(String userId) {
        return restaurantRepository.findByUserId(userId);
    }

    public List<Restaurant> findByStatus(RestaurantStatus status) {
        return restaurantRepository.findByStatus(status);
    }

    public List<Restaurant> findAll() {
        return restaurantRepository.findAll();
    }

    public Restaurant findById(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
    }

    public Restaurant create(String userId, Restaurant restaurant) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        restaurant.setUser(user);
        restaurant.setStatus(RestaurantStatus.PENDING);
        return  restaurantRepository.save(restaurant);
    }

    public Restaurant update(Long id, Restaurant updated) {
        Restaurant existing = findById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setAddress(updated.getAddress());
        existing.setCity(updated.getCity());
        return  restaurantRepository.save(existing);
    }

    public Restaurant approve(Long id) {
        Restaurant restaurant = findById(id);
        restaurant.setStatus(RestaurantStatus.APPROVED);
        User user = restaurant.getUser();
        user.setRole(Role.OWNER);
        userRepository.save(user);
        return restaurantRepository.save(restaurant);
    }

    public Restaurant decline(Long id) {
        Restaurant restaurant = findById(id);
        restaurant.setStatus(RestaurantStatus.REJECTED);
        return  restaurantRepository.save(restaurant);
    }

    public void delete(Long id) {
        restaurantRepository.deleteById(id);
    }
}
