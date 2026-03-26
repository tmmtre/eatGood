package com.tommaso.backend.mapper;

import com.tommaso.backend.dto.response.RestaurantResponse;
import com.tommaso.backend.model.Restaurant;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
public class RestaurantMapper implements Function<Restaurant, RestaurantResponse> {

    @Override
    public RestaurantResponse apply(Restaurant r) {
        return new RestaurantResponse(
                r.getId(),
                r.getName(),
                r.getDescription(),
                r.getAddress(),
                r.getCity(),
                r.getCreatedAt()
        );
    }
}
