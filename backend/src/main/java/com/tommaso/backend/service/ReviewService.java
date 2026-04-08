package com.tommaso.backend.service;

import com.tommaso.backend.dto.request.ReviewRequest;
import com.tommaso.backend.dto.response.ReviewResponse;
import com.tommaso.backend.mapper.ReviewMapper;
import com.tommaso.backend.model.MenuItem;
import com.tommaso.backend.model.Review;
import com.tommaso.backend.model.ReviewVote;
import com.tommaso.backend.model.User;
import com.tommaso.backend.repository.MenuItemRepository;
import com.tommaso.backend.repository.ReviewRepository;
import com.tommaso.backend.repository.ReviewVoteRepository;
import com.tommaso.backend.repository.UserRepository;
import com.tommaso.backend.s3.S3Buckets;
import com.tommaso.backend.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewVoteRepository reviewVoteRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final ReviewMapper reviewMapper;
    private final S3Service s3Service;
    private final S3Buckets s3Buckets;

    @Transactional(readOnly = true)
    public List<ReviewResponse> findByMenuItemId(Long menuItemId, Authentication auth) {
        String userId = resolveUserId(auth);
        return reviewRepository.findByMenuItemIdAndPublicReviewTrueOrderByCreatedAtDesc(menuItemId)
                .stream()
                .map(r -> reviewMapper.apply(r, userId))
                .toList();
    }

    @Transactional
    public ReviewResponse vote(Long reviewId, boolean trusted, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (reviewVoteRepository.existsByReviewIdAndUserId(reviewId, user.getId())) {
            throw new IllegalStateException("You have already voted on this review");
        }

        reviewVoteRepository.save(
                ReviewVote.builder().review(review).user(user).trusted(trusted).build()
        );

        return reviewMapper.apply(review, user.getId());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> findMyReviews(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(r -> reviewMapper.apply(r, user.getId()))
                .toList();
    }

    private String resolveUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        return userRepository.findByEmail(auth.getName())
                .map(User::getId)
                .orElse(null);
    }

    @Transactional
    public ReviewResponse create(Long menuItemId, ReviewRequest request, MultipartFile image, Authentication auth) throws IOException {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.isPublicReview() && reviewRepository.existsByMenuItemIdAndUserIdAndPublicReviewTrue(menuItemId, user.getId())) {
            throw new IllegalStateException("You have already posted a public review for this item");
        }

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        Review review = Review.builder()
                .rating(request.getRating())
                .comment(request.getComment())
                .mealTime(request.getMealTime())
                .anonymous(request.isAnonymous())
                .publicReview(request.isPublicReview())
                .menuItem(menuItem)
                .user(user)
                .build();

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("A photo is required");
        }
        if (image != null && !image.isEmpty()) {
            String imageId = UUID.randomUUID().toString();
            s3Service.putObject(
                    s3Buckets.getRestaurant(),
                    "reviews/%s/%s".formatted(menuItemId, imageId),
                    image.getBytes()
            );
            review.setImageId(imageId);
        }

        return reviewMapper.apply(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse publish(Long reviewId, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Not authorized");
        }
        if (!review.getCreatedAt().toLocalDate().equals(LocalDate.now())) {
            throw new IllegalStateException("Reviews can only be shared on the day they were created");
        }
        if (review.isPublicReview()) {
            throw new IllegalStateException("Review is already public");
        }
        if (reviewRepository.existsByMenuItemIdAndUserIdAndPublicReviewTrue(review.getMenuItem().getId(), user.getId())) {
            throw new IllegalStateException("You have already posted a public review for this item");
        }

        review.setPublicReview(true);
        return reviewMapper.apply(reviewRepository.save(review), user.getId());
    }

    @Transactional
    public void delete(Long reviewId, Authentication auth) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        boolean isOwner = review.getUser().getEmail().equals(auth.getName());
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isOwner && !isAdmin) {
            throw new SecurityException("Not authorized to delete this review");
        }

        reviewVoteRepository.deleteByReviewId(reviewId);

        if (review.getImageId() != null) {
            s3Service.deleteObject(
                    s3Buckets.getRestaurant(),
                    "reviews/%s/%s".formatted(review.getMenuItem().getId(), review.getImageId())
            );
        }

        menuItemRepository.findBySourceReviewId(reviewId)
                .forEach(item -> {
                    item.setSourceReviewId(null);
                    menuItemRepository.save(item);
                });

        reviewRepository.delete(review);
    }
}
