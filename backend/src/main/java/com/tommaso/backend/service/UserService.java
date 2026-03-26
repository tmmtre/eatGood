package com.tommaso.backend.service;

import com.tommaso.backend.dto.request.UserRequest;
import com.tommaso.backend.model.User;
import com.tommaso.backend.repository.UserRepository;
import com.tommaso.backend.s3.S3Buckets;
import com.tommaso.backend.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final S3Buckets s3Buckets;

    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User update(String id, UserRequest request) {
        User user = findById(id);
        boolean changes = false;

        if (request.getFirstName() != null
                && !request.getFirstName().equals(user.getFirstName())) {
            user.setFirstName(request.getFirstName());
            changes = true;
        }

        if (request.getLastName() != null
                && !request.getLastName().equals(user.getLastName())) {
            user.setLastName(request.getLastName());
            changes = true;
        }

        if (request.getEmail() != null
                && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already taken");
            }
            user.setEmail(request.getEmail());
            changes = true;
        }

        if (!changes) {
            throw new RuntimeException("No data changes found");
        }

        return userRepository.save(user);
    }

    public void delete(String id) {
        User user = findById(id);
        if (user.getProfileImageId() != null) {
            s3Service.deleteObject(
                    s3Buckets.getRestaurant(),
                    "profile-images/%s/%s".formatted(id, user.getProfileImageId())
            );
        }
        userRepository.deleteById(id);
    }

    public void uploadProfileImage(String userId, MultipartFile image) throws IOException {
        User user = findById(userId);

        if (user.getProfileImageId() != null) {
            s3Service.deleteObject(
                    s3Buckets.getRestaurant(),
                    "profile-images/%s/%s".formatted(userId, user.getProfileImageId())
            );
        }

        String imageId = UUID.randomUUID().toString();
        s3Service.putObject(
                s3Buckets.getRestaurant(),
                "profile-images/%s/%s".formatted(userId, imageId),
                image.getBytes()
        );

        userRepository.updateProfileImageId(imageId, userId);
    }

    public byte[] getProfileImage(String userId) {
        User user = findById(userId);

        if (user.getProfileImageId() == null) {
            throw new RuntimeException("Profile image not found for user: " + userId);
        }

        return s3Service.getObject(
                s3Buckets.getRestaurant(),
                "profile-images/%s/%s".formatted(userId, user.getProfileImageId())
        );
    }
}
