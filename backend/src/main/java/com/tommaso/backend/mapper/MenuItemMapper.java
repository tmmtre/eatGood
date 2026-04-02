package com.tommaso.backend.mapper;

import com.tommaso.backend.dto.response.MenuItemResponse;
import com.tommaso.backend.model.MenuItem;
import com.tommaso.backend.repository.ReviewRepository;
import com.tommaso.backend.s3.S3Buckets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
public class MenuItemMapper implements Function<MenuItem, MenuItemResponse> {

    @Value("${aws.region}")
    private String awsRegion;

    private final S3Buckets s3Buckets;
    private final ReviewRepository reviewRepository;

    public MenuItemMapper(S3Buckets s3Buckets, ReviewRepository reviewRepository) {
        this.s3Buckets = s3Buckets;
        this.reviewRepository = reviewRepository;
    }

    @Override
    public MenuItemResponse apply(MenuItem i) {
        return new MenuItemResponse(
                i.getId(),
                i.getName(),
                i.getDescription(),
                i.getPrice(),
                i.getAvailable(),
                i.getImageId() != null
                        ? "https://" + s3Buckets.getRestaurant()
                        + ".s3." + awsRegion
                        + ".amazonaws.com/menu-items/"
                        + i.getSection().getId() + "/"
                        + i.getImageId()
                        : null,
                i.getCreatedAt(),
                reviewRepository.findAverageRatingByMenuItemId(i.getId()),
                reviewRepository.countByMenuItemId(i.getId())
        );
    }
}
