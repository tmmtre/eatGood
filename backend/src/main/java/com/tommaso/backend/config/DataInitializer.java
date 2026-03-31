package com.tommaso.backend.config;

import com.tommaso.backend.model.User;
import com.tommaso.backend.model.enums.Role;
import com.tommaso.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.password}")
    private String adminPassword;

    @Value("${admin.first-name}")
    private String adminFirstName;

    @Value("${admin.last-name}")
    private String adminLastName;

    @Override
    public void run(@NonNull ApplicationArguments args) {
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .firstName(adminFirstName)
                    .lastName(adminLastName)
                    .role(Role.ADMIN)
                    .emailVerified(true)
                    .build();
            userRepository.save(admin);
            System.out.println("Admin account created: " + adminEmail);
        }
    }
}
