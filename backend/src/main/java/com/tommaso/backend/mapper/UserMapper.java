package com.tommaso.backend.mapper;

import com.tommaso.backend.dto.response.UserResponse;
import com.tommaso.backend.model.User;
import com.tommaso.backend.repository.ReviewLikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
@RequiredArgsConstructor
public class UserMapper implements Function<User, UserResponse> {

    private final ReviewLikeRepository reviewLikeRepository;

    @Override
    public UserResponse apply(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole().name(),
                user.getEmailVerified(),
                user.getProfileImageId(),
                user.getProfileImageId() != null
                        ? "/api/v1/users/" + user.getId() + "/profile-image"
                        : null,
                reviewLikeRepository.countByReviewUserId(user.getId()),
                user.getCreatedAt()
        );
    }
}
