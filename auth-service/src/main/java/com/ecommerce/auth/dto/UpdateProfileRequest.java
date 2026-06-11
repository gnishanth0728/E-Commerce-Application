package com.ecommerce.auth.dto;

public record UpdateProfileRequest(
        String currentPassword,
        String newEmail,
        String newPassword
) {
}
