package com.tommaso.backend.service;

import com.tommaso.backend.dto.request.ReviewRequest;
import com.tommaso.backend.dto.response.ReviewResponse;
import com.tommaso.backend.mapper.ReviewMapper;
import com.tommaso.backend.model.MenuItem;
import com.tommaso.backend.model.Review;
import com.tommaso.backend.model.ReviewLike;
import com.tommaso.backend.model.User;
import com.tommaso.backend.repository.MenuItemRepository;
import com.tommaso.backend.repository.ReviewLikeRepository;
import com.tommaso.backend.repository.ReviewRepository;
import com.tommaso.backend.repository.UserRepository;
import com.tommaso.backend.s3.S3Buckets;
import com.tommaso.backend.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final ReviewMapper reviewMapper;
    private final S3Service s3Service;
    private final S3Buckets s3Buckets;

    @Transactional(readOnly = true)
    public List<ReviewResponse> findByMenuItemId(Long menuItemId, Authentication auth) {
        String userId = resolveUserId(auth);
        return reviewRepository.findByMenuItemIdOrderByCreatedAtDesc(menuItemId)
                .stream()
                .map(r -> reviewMapper.apply(r, userId))
                .toList();
    }

    @Transactional
    public ReviewResponse toggleLike(Long reviewId, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        reviewLikeRepository.findByReviewIdAndUserId(reviewId, user.getId())
                .ifPresentOrElse(
                        reviewLikeRepository::delete,
                        () -> reviewLikeRepository.save(
                                ReviewLike.builder().review(review).user(user).build()
                        )
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

        if (reviewRepository.existsByMenuItemIdAndUserId(menuItemId, user.getId())) {
            throw new IllegalStateException("You have already reviewed this item");
        }

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        Review review = Review.builder()
                .rating(request.getRating())
                .comment(request.getComment())
                .mealTime(request.getMealTime())
                .anonymous(request.isAnonymous())
                .menuItem(menuItem)
                .user(user)
                .build();

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
    public void delete(Long reviewId, Authentication auth) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        boolean isOwner = review.getUser().getEmail().equals(auth.getName());
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isOwner && !isAdmin) {
            throw new SecurityException("Not authorized to delete this review");
        }

        reviewLikeRepository.deleteByReviewId(reviewId);

        if (review.getImageId() != null) {
            s3Service.deleteObject(
                    s3Buckets.getRestaurant(),
                    "reviews/%s/%s".formatted(review.getMenuItem().getId(), review.getImageId())
            );
        }

        reviewRepository.delete(review);
    }
}
