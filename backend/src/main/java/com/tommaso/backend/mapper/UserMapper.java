package com.tommaso.backend.mapper;

import com.tommaso.backend.dto.response.UserResponse;
import com.tommaso.backend.model.User;
import com.tommaso.backend.repository.MenuItemRepository;
import com.tommaso.backend.repository.ReviewVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
@RequiredArgsConstructor
public class UserMapper implements Function<User, UserResponse> {

    private final ReviewVoteRepository reviewVoteRepository;
    private final MenuItemRepository menuItemRepository;

    @Override
    public UserResponse apply(User user) {
        long totalVotes = reviewVoteRepository.countAllByUserId(user.getId());
        Double trustPercentage = totalVotes > 0
                ? (reviewVoteRepository.countTrustByUserId(user.getId()) * 100.0) / totalVotes
                : null;

        long ownerPickCount = menuItemRepository.countOwnerPicksByUserId(user.getId());

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
                trustPercentage,
                user.getCreatedAt(),
                ownerPickCount
        );
    }
}
