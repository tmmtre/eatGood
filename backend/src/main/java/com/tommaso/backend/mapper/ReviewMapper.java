package com.tommaso.backend.mapper;

import com.tommaso.backend.dto.response.ReviewResponse;
import com.tommaso.backend.model.Review;
import com.tommaso.backend.repository.ReviewVoteRepository;
import com.tommaso.backend.s3.S3Buckets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
public class ReviewMapper implements Function<Review, ReviewResponse> {

    @Value("${aws.region}")
    private String awsRegion;

    private final S3Buckets s3Buckets;
    private final ReviewVoteRepository reviewVoteRepository;

    public ReviewMapper(S3Buckets s3Buckets, ReviewVoteRepository reviewVoteRepository) {
        this.s3Buckets = s3Buckets;
        this.reviewVoteRepository = reviewVoteRepository;
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

        long trustCount = reviewVoteRepository.countByReviewIdAndTrusted(r.getId(), true);
        long untrustCount = reviewVoteRepository.countByReviewIdAndTrusted(r.getId(), false);

        String currentUserVote = null;
        if (userId != null) {
            var optVote = reviewVoteRepository.findByReviewIdAndUserId(r.getId(), userId);
            if (optVote.isPresent()) {
                currentUserVote = optVote.get().isTrusted() ? "TRUST" : "UNTRUST";
            }
        }

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
                trustCount,
                untrustCount,
                currentUserVote,
                r.getMealTime(),
                r.getMenuItem().getName(),
                restaurantName,
                anon,
                r.isPublicReview()
        );
    }
}
