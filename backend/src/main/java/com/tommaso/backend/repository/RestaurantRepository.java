package com.tommaso.backend.repository;

import com.tommaso.backend.model.Restaurant;
import com.tommaso.backend.model.enums.RestaurantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    List<Restaurant> findByUserId(String userId);
    List<Restaurant> findByStatus(RestaurantStatus status);
    Boolean existsByNameAndUserId(String name, String userId);
}
