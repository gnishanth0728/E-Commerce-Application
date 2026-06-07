package com.ecommerce.auth.service;

import com.ecommerce.auth.dto.AuthResponse;
import com.ecommerce.auth.dto.LoginRequest;
import com.ecommerce.auth.dto.RegisterRequest;
import com.ecommerce.auth.entity.Role;
import com.ecommerce.auth.entity.User;
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

            throw new RuntimeException(
                    "Email already exists");
        }

        Role role =
                roleRepository.findByName("USER")
                        .orElseThrow();

        User user = new User();

        user.setUsername(
                request.username());

        user.setEmail(
                request.email());

        user.setPassword(
                passwordEncoder.encode(
                        request.password()));

        user.setRole(role);

        userRepository.save(user);

        return "User Registered";
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

            throw new RuntimeException(
                    "Invalid password");
        }

        String token =
                jwtService.generateToken(
                        user.getEmail(),
                        user.getRole().getName());

        return new AuthResponse(
                token);
    }
}