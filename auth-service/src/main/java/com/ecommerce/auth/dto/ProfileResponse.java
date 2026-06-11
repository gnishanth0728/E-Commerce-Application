package com.ecommerce.auth.dto;

public record ProfileResponse(
        String username,
        String email,
        String role
) {
}
