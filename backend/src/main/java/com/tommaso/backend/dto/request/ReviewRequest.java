package com.tommaso.backend.dto.request;

import com.tommaso.backend.model.enums.MealTime;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequest {

    @DecimalMin(value = "0.5", message = "Rating must be at least 0.5")
    @DecimalMax(value = "5.0", message = "Rating must be at most 5")
    private double rating;

    private String comment;

    private MealTime mealTime;

    private boolean anonymous = false;

    private boolean publicReview = false;
}
