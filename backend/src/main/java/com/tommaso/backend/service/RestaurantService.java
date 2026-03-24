package com.tommaso.backend.service;

import com.tommaso.backend.model.Restaurant;
import com.tommaso.backend.model.User;
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

    public Restaurant findById(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
    }

    public Restaurant create(String userId, Restaurant restaurant) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        restaurant.setUser(user);
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

    public void delete(Long id) {
        restaurantRepository.deleteById(id);
    }
}
