package com.tommaso.backend.service;

import com.tommaso.backend.model.MenuItem;
import com.tommaso.backend.model.MenuSection;
import com.tommaso.backend.model.Review;
import com.tommaso.backend.repository.MenuItemRepository;
import com.tommaso.backend.repository.MenuSectionRepository;
import com.tommaso.backend.repository.ReviewRepository;
import com.tommaso.backend.repository.ReviewVoteRepository;
import com.tommaso.backend.s3.S3Buckets;
import com.tommaso.backend.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final MenuSectionRepository menuSectionRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewVoteRepository reviewVoteRepository;
    private final S3Service s3Service;
    private final S3Buckets s3Buckets;

    @Transactional(readOnly = true)
    public List<MenuItem> findBySectionId(Long sectionId) {
        return menuItemRepository.findBySectionId(sectionId);
    }

    @Transactional(readOnly = true)
    public MenuItem findById(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu Item not found"));
    }

public MenuItem create(Long sectionId, MenuItem item, MultipartFile image) throws IOException {
        MenuSection section = menuSectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Menu Section not found"));

        if (image != null && !image.isEmpty()) {
            String imageId = UUID.randomUUID().toString();
            String key = "menu-items/%s/%s".formatted(sectionId, imageId);
            s3Service.putObject(s3Buckets.getRestaurant(), key, image.getBytes());
            item.setImageId(imageId);
        }

        item.setSection(section);
        return menuItemRepository.save(item);
    }

    @Transactional
    public MenuItem update(Long id, MenuItem updated, MultipartFile image) throws IOException {
        MenuItem existing = findById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setPrice(updated.getPrice());
        existing.setAvailable(updated.getAvailable());

        if (image != null && !image.isEmpty()) {
            if (existing.getImageId() != null) {
                Long sectionId = existing.getSection().getId();
                s3Service.deleteObject(
                        s3Buckets.getRestaurant(),
                        "menu-items/%s/%s".formatted(sectionId, existing.getImageId())
                );
            }
            String imageId = UUID.randomUUID().toString();
            Long sectionId = existing.getSection().getId();
            s3Service.putObject(
                    s3Buckets.getRestaurant(),
                    "menu-items/%s/%s".formatted(sectionId, imageId),
                    image.getBytes()
            );
            existing.setImageId(imageId);
            existing.setSourceReviewId(null);
        }

        return menuItemRepository.save(existing);
    }

    @Transactional
    public MenuItem setImageFromReview(Long itemId, Long reviewId) {
        MenuItem item = findById(itemId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (review.getImageId() == null) {
            throw new RuntimeException("Review has no image");
        }

        if (item.getImageId() != null) {
            s3Service.deleteObject(
                    s3Buckets.getRestaurant(),
                    "menu-items/%s/%s".formatted(item.getSection().getId(), item.getImageId())
            );
        }

        String newImageId = UUID.randomUUID().toString();
        byte[] imageBytes = s3Service.getObject(
                s3Buckets.getRestaurant(),
                "reviews/%s/%s".formatted(itemId, review.getImageId())
        );
        s3Service.putObject(
                s3Buckets.getRestaurant(),
                "menu-items/%s/%s".formatted(item.getSection().getId(), newImageId),
                imageBytes
        );

        item.setImageId(newImageId);
        item.setSourceReviewId(reviewId);
        return menuItemRepository.save(item);
    }

    @Transactional
    public void delete(Long id) {
        MenuItem item = findById(id);

        List<Review> reviews = reviewRepository.findByMenuItemIdOrderByCreatedAtDesc(id);
        for (Review review : reviews) {
            reviewVoteRepository.deleteByReviewId(review.getId());
            if (review.getImageId() != null) {
                s3Service.deleteObject(
                        s3Buckets.getRestaurant(),
                        "reviews/%s/%s".formatted(id, review.getImageId())
                );
            }
        }
        reviewRepository.deleteByMenuItemId(id);

        if (item.getImageId() != null) {
            Long sectionId = item.getSection().getId();
            s3Service.deleteObject(
                    s3Buckets.getRestaurant(),
                    "menu-items/%s/%s".formatted(sectionId, item.getImageId())
            );
        }
        menuItemRepository.deleteById(id);
    }
}
