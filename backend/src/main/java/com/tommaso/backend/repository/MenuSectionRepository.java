package com.tommaso.backend.repository;

import com.tommaso.backend.model.MenuSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuSectionRepository extends JpaRepository<MenuSection, Long> {

    List<MenuSection> findByRestaurantId(Long restaurantId);
}
