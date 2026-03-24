package com.tommaso.backend.repository;

import com.tommaso.backend.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findBySectionId(Long sectionId);
    List<MenuItem> findBySectionRestaurantId(Long restaurantId);
}
