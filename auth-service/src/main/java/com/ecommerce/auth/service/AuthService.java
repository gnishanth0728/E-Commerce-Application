package com.ecommerce.auth.service;

import com.ecommerce.auth.dto.AuthResponse;
import com.ecommerce.auth.dto.LoginRequest;
import com.ecommerce.auth.dto.ProfileResponse;
import com.ecommerce.auth.dto.RegisterRequest;
import com.ecommerce.auth.dto.UpdateProfileRequest;
import com.ecommerce.auth.entity.Role;
import com.ecommerce.auth.entity.User;
import com.ecommerce.auth.exception.EmailAlreadyExistsException;
import com.ecommerce.auth.exception.InvalidCurrentPasswordException;
import com.ecommerce.auth.exception.ProfileUpdateException;
import com.ecommerce.auth.repository.RoleRepository;
import com.ecommerce.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public String register(
            RegisterRequest request) {

        if (userRepository.existsByEmail(
                request.email())) {

            throw new EmailAlreadyExistsException(
                    "Email already exists");
        }

        Role role =
                roleRepository.findByName("USER")
                        .orElseThrow(() ->
                                new RuntimeException("Role not found"));

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(
                passwordEncoder.encode(
                        request.password()));
        user.setRole(role);

        userRepository.save(user);

        return "User Registered Successfully";
    }

    public AuthResponse login(
            LoginRequest request) {

        User user =
                userRepository.findByEmail(
                                request.email())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"));

        boolean valid =
                passwordEncoder.matches(
                        request.password(),
                        user.getPassword());

        if (!valid) {
            throw new RuntimeException("Invalid password");
        }

        String token =
                jwtService.generateToken(
                        user.getEmail(),
                        user.getRole().getName());

        return new AuthResponse(
                token,
                user.getUsername(),
                user.getEmail());
    }

    public ProfileResponse getProfile(
            String email) {

        User user = getUserByEmail(email);
        return new ProfileResponse(
                user.getUsername(),
                user.getEmail(),
                user.getRole().getName());
    }

    public AuthResponse updateProfile(
            String currentEmail,
            UpdateProfileRequest request) {

        User user = getUserByEmail(currentEmail);
        boolean hasNewEmail = request.newEmail() != null && !request.newEmail().isBlank();
        boolean hasNewPassword = request.newPassword() != null && !request.newPassword().isBlank();

        if (!hasNewEmail && !hasNewPassword) {
            throw new ProfileUpdateException("Please provide a new email or password to update");
        }

        if (request.currentPassword() == null || request.currentPassword().isBlank()) {
            throw new ProfileUpdateException("Current password is required to update your profile");
        }

        if (!passwordEncoder.matches(
                request.currentPassword(),
                user.getPassword())) {

            throw new InvalidCurrentPasswordException(
                    "Current password is incorrect");
        }

        if (hasNewEmail) {
            String newEmail = request.newEmail().trim();
            if (!newEmail.equalsIgnoreCase(user.getEmail())
                    && userRepository.existsByEmailAndIdNot(newEmail, user.getId())) {
                throw new EmailAlreadyExistsException("Email already exists");
            }
            user.setEmail(newEmail);
        }

        if (hasNewPassword) {
            user.setPassword(
                    passwordEncoder.encode(
                            request.newPassword()));
        }

        userRepository.save(user);

        String token =
                jwtService.generateToken(
                        user.getEmail(),
                        user.getRole().getName());

        return new AuthResponse(
                token,
                user.getUsername(),
                user.getEmail());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
