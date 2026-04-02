package com.tommaso.backend.service;

import com.tommaso.backend.dto.response.MenuSectionResponse;
import com.tommaso.backend.mapper.MenuSectionMapper;
import com.tommaso.backend.model.MenuSection;
import com.tommaso.backend.model.Restaurant;
import com.tommaso.backend.repository.MenuSectionRepository;
import com.tommaso.backend.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuSectionService {

    private final MenuSectionRepository menuSectionRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuSectionMapper menuSectionMapper;

    @Transactional(readOnly = true)
    public List<MenuSectionResponse> findByRestaurantId(Long restaurantId) {
        return menuSectionRepository.findByRestaurantId(restaurantId)
                .stream()
                .map(menuSectionMapper)
                .toList();
    }

    @Transactional(readOnly = true)
    public MenuSection findById(Long id) {
        return menuSectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MenuSection not found"));
    }

    public MenuSection create(Long restaurantId, MenuSection section) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        section.setRestaurant(restaurant);
        return menuSectionRepository.save(section);
    }

    @Transactional
    public MenuSection update(Long id, MenuSection updated) {
        MenuSection existing = findById(id);
        existing.setName(updated.getName());
        existing.setCategory(updated.getCategory());
        return menuSectionRepository.save(existing);
    }

    public void delete(Long id) {
        menuSectionRepository.deleteById(id);
    }
}
