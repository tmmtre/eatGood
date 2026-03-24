package com.tommaso.backend.repository;

import com.tommaso.backend.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    List<Restaurant> findByUserId(String userId);
    Boolean existsByNameAndUserId(String name, String userId);
}
