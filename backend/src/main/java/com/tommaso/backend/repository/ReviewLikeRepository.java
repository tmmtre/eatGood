package com.tommaso.backend.repository;

import com.tommaso.backend.model.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    long countByReviewId(Long reviewId);

    @Query("SELECT COUNT(rl) FROM ReviewLike rl WHERE rl.review.user.id = :userId")
    long countByReviewUserId(@Param("userId") String userId);

    boolean existsByReviewIdAndUserId(Long reviewId, String userId);

    Optional<ReviewLike> findByReviewIdAndUserId(Long reviewId, String userId);

    void deleteByReviewId(Long reviewId);
}
