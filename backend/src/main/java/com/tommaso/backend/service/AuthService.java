package com.tommaso.backend.service;

import com.tommaso.backend.dto.request.LoginRequest;
import com.tommaso.backend.dto.request.RegisterRequest;
import com.tommaso.backend.dto.response.AuthResponse;
import com.tommaso.backend.mapper.AuthMapper;
import com.tommaso.backend.model.User;
import com.tommaso.backend.model.enums.Role;
import com.tommaso.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;
    private final AuthMapper authMapper;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(encoder.encode(request.getPassword()))
                .role(Role.USER)
                .emailVerified(false)
                .build();

        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return authMapper.toAuthResponse(user, token);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String token = jwtService.generateToken(user);
        return authMapper.toAuthResponse(user, token);
    }

}
