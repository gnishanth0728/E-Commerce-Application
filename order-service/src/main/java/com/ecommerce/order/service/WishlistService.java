package com.ecommerce.order.service;

import com.ecommerce.order.dto.WishlistItemRequest;
import com.ecommerce.order.dto.WishlistItemResponse;
import com.ecommerce.order.entity.Wishlist;
import com.ecommerce.order.repository.WishlistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class WishlistService {

    private static final Logger LOGGER = LoggerFactory.getLogger(WishlistService.class);

    @Autowired
    private WishlistRepository wishlistRepository;

    public WishlistItemResponse addToWishlist(String userEmail, WishlistItemRequest request) {
        LOGGER.info("Adding product {} to wishlist for user {}", request.getProductId(), userEmail);
        
        // Check if already exists
        if (wishlistRepository.existsByUserEmailAndProductId(userEmail, request.getProductId())) {
            LOGGER.warn("Product {} already in wishlist for user {}", request.getProductId(), userEmail);
            throw new IllegalArgumentException("Item already in wishlist");
        }

        Wishlist wishlistItem = new Wishlist();
        wishlistItem.setUserEmail(userEmail);
        wishlistItem.setProductId(request.getProductId());
        wishlistItem.setProductName(request.getProductName());
        wishlistItem.setProductPrice(request.getProductPrice());
        wishlistItem.setProductImageUrl(request.getProductImageUrl());
        wishlistItem.setCreatedAt(LocalDateTime.now());

        Wishlist saved = wishlistRepository.save(wishlistItem);
        LOGGER.info("Successfully added product {} to wishlist for user {}", request.getProductId(), userEmail);

        return convertToResponse(saved);
    }

    public void removeFromWishlist(String userEmail, Long productId) {
        LOGGER.info("Removing product {} from wishlist for user {}", productId, userEmail);
        
        wishlistRepository.deleteByUserEmailAndProductId(userEmail, productId);
        
        LOGGER.info("Successfully removed product {} from wishlist for user {}", productId, userEmail);
    }

    public List<WishlistItemResponse> getWishlist(String userEmail) {
        LOGGER.info("Fetching wishlist for user {}", userEmail);
        
        List<Wishlist> wishlistItems = wishlistRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        
        return wishlistItems.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public boolean isInWishlist(String userEmail, Long productId) {
        return wishlistRepository.existsByUserEmailAndProductId(userEmail, productId);
    }

    private WishlistItemResponse convertToResponse(Wishlist wishlist) {
        WishlistItemResponse response = new WishlistItemResponse();
        response.setId(wishlist.getId());
        response.setProductId(wishlist.getProductId());
        response.setProductName(wishlist.getProductName());
        response.setProductPrice(wishlist.getProductPrice());
        response.setProductImageUrl(wishlist.getProductImageUrl());
        response.setCreatedAt(wishlist.getCreatedAt());
        return response;
    }
}
