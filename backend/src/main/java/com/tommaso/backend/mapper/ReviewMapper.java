package com.tommaso.backend.mapper;

import com.tommaso.backend.dto.response.ReviewResponse;
import com.tommaso.backend.model.Review;
import com.tommaso.backend.repository.ReviewLikeRepository;
import com.tommaso.backend.s3.S3Buckets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
public class ReviewMapper implements Function<Review, ReviewResponse> {

    @Value("${aws.region}")
    private String awsRegion;

    private final S3Buckets s3Buckets;
    private final ReviewLikeRepository reviewLikeRepository;

    public ReviewMapper(S3Buckets s3Buckets, ReviewLikeRepository reviewLikeRepository) {
        this.s3Buckets = s3Buckets;
        this.reviewLikeRepository = reviewLikeRepository;
    }

    @Override
    public ReviewResponse apply(Review r) {
        return apply(r, null);
    }

    public ReviewResponse apply(Review r, String userId) {
        String imageUrl = r.getImageId() != null
                ? "https://" + s3Buckets.getRestaurant()
                + ".s3." + awsRegion
                + ".amazonaws.com/reviews/"
                + r.getMenuItem().getId() + "/"
                + r.getImageId()
                : null;

        long likeCount = reviewLikeRepository.countByReviewId(r.getId());
        boolean liked = userId != null && reviewLikeRepository.existsByReviewIdAndUserId(r.getId(), userId);

        String restaurantName = r.getMenuItem().getSection().getRestaurant().getName();
        boolean anon = r.isAnonymous();

        return new ReviewResponse(
                r.getId(),
                r.getRating(),
                r.getComment(),
                imageUrl,
                r.getCreatedAt(),
                new ReviewResponse.ReviewUserDto(
                        r.getUser().getId(),
                        anon ? "Anonymous" : r.getUser().getFirstName(),
                        anon ? "" : r.getUser().getLastName()
                ),
                likeCount,
                liked,
                r.getMealTime(),
                r.getMenuItem().getName(),
                restaurantName,
                anon
        );
    }
}
