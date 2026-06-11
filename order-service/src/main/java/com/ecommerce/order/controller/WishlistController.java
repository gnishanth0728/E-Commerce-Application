package com.ecommerce.order.controller;

import com.ecommerce.order.dto.WishlistItemRequest;
import com.ecommerce.order.dto.WishlistItemResponse;
import com.ecommerce.order.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @PostMapping("/add")
    public ResponseEntity<?> addToWishlist(
            Authentication authentication,
            @RequestBody WishlistItemRequest request
    ) {
        String userEmail = (String) authentication.getPrincipal();
        try {
            WishlistItemResponse response = wishlistService.addToWishlist(userEmail, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<?> removeFromWishlist(
            Authentication authentication,
            @PathVariable Long productId
    ) {
        String userEmail = (String) authentication.getPrincipal();
        wishlistService.removeFromWishlist(userEmail, productId);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Item removed from wishlist");
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<WishlistItemResponse>> getWishlist(
            Authentication authentication
    ) {
        String userEmail = (String) authentication.getPrincipal();
        List<WishlistItemResponse> wishlistItems = wishlistService.getWishlist(userEmail);
        return ResponseEntity.ok(wishlistItems);
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<?> checkIfInWishlist(
            Authentication authentication,
            @PathVariable Long productId
    ) {
        String userEmail = (String) authentication.getPrincipal();
        boolean isInWishlist = wishlistService.isInWishlist(userEmail, productId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("productId", productId);
        response.put("inWishlist", isInWishlist);
        return ResponseEntity.ok(response);
    }
}
