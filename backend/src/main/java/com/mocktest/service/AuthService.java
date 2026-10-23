package com.mocktest.service;

import com.mocktest.dto.request.LoginRequest;
import com.mocktest.dto.request.RegisterRequest;
import com.mocktest.dto.response.AuthResponse;
import com.mocktest.dto.response.UserDto;
import com.mocktest.entity.Role;
import com.mocktest.entity.User;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.repository.UserRepository;
import com.mocktest.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email already exists");
        }

        Role role = Role.ROLE_USER;
        if (request.role() != null) {
            String roleStr = request.role().toUpperCase().trim();
            if (roleStr.equals("ADMIN") || roleStr.equals("ROLE_ADMIN")) {
                role = Role.ROLE_ADMIN;
            }
        }

        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.password()))
                .role(role)
                .enabled(true)
                .build();

        User saved = userRepository.save(user);

        String token = jwtService.generateToken(
                Map.of(
                        "role", saved.getRole().name(),
                        "userId", saved.getId(),
                        "fullName", saved.getFullName()
                ),
                saved
        );

        UserDto userDto = new UserDto(saved.getId(), saved.getFullName(), saved.getEmail(), saved.getRole().name());
        return AuthResponse.of(token, userDto);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().toLowerCase().trim();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        String token = jwtService.generateToken(
                Map.of(
                        "role", user.getRole().name(),
                        "userId", user.getId(),
                        "fullName", user.getFullName()
                ),
                user
        );

        UserDto userDto = new UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
        return AuthResponse.of(token, userDto);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return new UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
    }
}
