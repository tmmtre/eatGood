package com.tommaso.backend.repository;

import com.tommaso.backend.model.ReviewVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewVoteRepository extends JpaRepository<ReviewVote, Long> {

    long countByReviewIdAndTrusted(Long reviewId, boolean trusted);

    boolean existsByReviewIdAndUserId(Long reviewId, String userId);

    Optional<ReviewVote> findByReviewIdAndUserId(Long reviewId, String userId);

    void deleteByReviewId(Long reviewId);

    @Query("SELECT COUNT(rv) FROM ReviewVote rv WHERE rv.review.user.id = :userId AND rv.trusted = true")
    long countTrustByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(rv) FROM ReviewVote rv WHERE rv.review.user.id = :userId")
    long countAllByUserId(@Param("userId") String userId);
}
