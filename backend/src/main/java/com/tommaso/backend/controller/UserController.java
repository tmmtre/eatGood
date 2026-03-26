package com.tommaso.backend.controller;

import com.tommaso.backend.dto.request.UserRequest;
import com.tommaso.backend.dto.response.UserResponse;
import com.tommaso.backend.mapper.UserMapper;
import com.tommaso.backend.s3.S3Buckets;
import com.tommaso.backend.s3.S3Service;
import com.tommaso.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final S3Service s3Service;
    private final S3Buckets s3Buckets;

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(userMapper.apply(userService.findById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(
            @PathVariable String id,
            @RequestBody @Valid UserRequest request) {
        return ResponseEntity.ok(userMapper.apply(userService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/{id}/profile-image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadProfileImage(
            @PathVariable String id,
            @RequestParam("image") MultipartFile image) throws IOException {
        userService.uploadProfileImage(id, image);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/profile-image")
    public ResponseEntity<byte[]> getProfileImage(@PathVariable String id) {
        byte[] image = userService.getProfileImage(id);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(image);
    }
}
