package com.tommaso.backend.controller;

import com.tommaso.backend.dto.request.ReviewRequest;
import com.tommaso.backend.dto.response.ReviewResponse;
import com.tommaso.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/item/{menuItemId}")
    public ResponseEntity<List<ReviewResponse>> getByItem(
            @PathVariable Long menuItemId,
            Authentication authentication) {
        return ResponseEntity.ok(reviewService.findByMenuItemId(menuItemId, authentication));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(Authentication authentication) {
        return ResponseEntity.ok(reviewService.findMyReviews(authentication));
    }

    @PostMapping("/{reviewId}/vote")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewResponse> vote(
            @PathVariable Long reviewId,
            @RequestParam boolean trusted,
            Authentication authentication) {
        return ResponseEntity.ok(reviewService.vote(reviewId, trusted, authentication));
    }

    @PostMapping(value = "/item/{menuItemId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewResponse> create(
            @PathVariable Long menuItemId,
            @RequestPart("review") @Valid ReviewRequest request,
            @RequestPart(value = "image") MultipartFile image,
            Authentication authentication) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.create(menuItemId, request, image, authentication));
    }

    @PutMapping("/{reviewId}/publish")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewResponse> publish(
            @PathVariable Long reviewId,
            Authentication authentication) {
        return ResponseEntity.ok(reviewService.publish(reviewId, authentication));
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(
            @PathVariable Long reviewId,
            Authentication authentication) {
        reviewService.delete(reviewId, authentication);
        return ResponseEntity.noContent().build();
    }
}
