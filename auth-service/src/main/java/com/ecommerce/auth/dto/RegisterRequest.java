package com.ecommerce.auth.dto;

public record RegisterRequest(
        String username,
        String email,
        String password
) {
}