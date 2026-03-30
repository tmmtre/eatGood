package com.tommaso.backend.security;

import com.tommaso.backend.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("restaurantSecurity")
@RequiredArgsConstructor
public class RestaurantSecurity {

    private final RestaurantRepository restaurantRepository;

    public boolean isOwner(Long restaurantId, Authentication authentication) {
        String email = authentication.getName();
        return restaurantRepository.findById(restaurantId)
                .map(r -> r.getUser().getEmail().equals(email))
                .orElse(false);
    }
}
