package com.tommaso.backend.repository;

import com.tommaso.backend.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findBySectionId(Long sectionId);
    List<MenuItem> findBySectionRestaurantId(Long restaurantId);
    List<MenuItem> findBySourceReviewId(Long sourceReviewId);

    @Query("SELECT COUNT(m) FROM MenuItem m JOIN Review r ON m.sourceReviewId = r.id WHERE r.user.id = :userId")
    long countOwnerPicksByUserId(@Param("userId") String userId);
}
