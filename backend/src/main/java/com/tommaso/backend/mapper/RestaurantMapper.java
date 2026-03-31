package com.tommaso.backend.mapper;

import com.tommaso.backend.dto.response.RestaurantResponse;
import com.tommaso.backend.model.Restaurant;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
public class RestaurantMapper implements Function<Restaurant, RestaurantResponse> {

    @Override
    public RestaurantResponse apply(Restaurant r) {
        RestaurantResponse.UserSummary user = new RestaurantResponse.UserSummary(
                r.getUser().getId(),
                r.getUser().getEmail(),
                r.getUser().getFirstName(),
                r.getUser().getLastName()
        );
        return new RestaurantResponse(
                r.getId(),
                r.getName(),
                r.getDescription(),
                r.getAddress(),
                r.getCity(),
                r.getStatus().name(),
                r.getCreatedAt(),
                user
        );
    }
}
