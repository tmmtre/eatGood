package com.tommaso.backend.repository;

import com.tommaso.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByMenuItemIdAndPublicReviewTrueOrderByCreatedAtDesc(Long menuItemId);

    List<Review> findByMenuItemIdOrderByCreatedAtDesc(Long menuItemId);

    List<Review> findByUserIdOrderByCreatedAtDesc(String userId);

    boolean existsByMenuItemIdAndUserId(Long menuItemId, String userId);

    boolean existsByMenuItemIdAndUserIdAndPublicReviewTrue(Long menuItemId, String userId);

    Optional<Review> findByMenuItemIdAndUserId(Long menuItemId, String userId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.menuItem.id = :menuItemId AND r.publicReview = true")
    Double findAverageRatingByMenuItemId(Long menuItemId);

    Long countByMenuItemIdAndPublicReviewTrue(Long menuItemId);

    Long countByMenuItemId(Long menuItemId);

    void deleteByMenuItemId(Long menuItemId);
}
