package com.ecommerce.cart.service;

import com.ecommerce.cart.dto.AddToCartRequest;
import com.ecommerce.cart.dto.CheckoutResponse;
import com.ecommerce.cart.entity.Cart;
import com.ecommerce.cart.entity.CartItem;
import com.ecommerce.cart.repository.CartItemRepository;
import com.ecommerce.cart.repository.CartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
@Transactional
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    public Cart getOrCreateCart(String userEmail) {
        return cartRepository.findByUserEmail(userEmail)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUserEmail(userEmail);
                    return cartRepository.save(newCart);
                });
    }

    public Cart addToCart(String userEmail, AddToCartRequest request) {
        Cart cart = getOrCreateCart(userEmail);

        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), request.getProductId());

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            item.setUpdatedAt(System.currentTimeMillis());
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProductId(request.getProductId());
            newItem.setProductName(request.getProductName());
            newItem.setPrice(request.getPrice());
            newItem.setQuantity(request.getQuantity());
            newItem.setImageUrl(request.getImageUrl());
            cartItemRepository.save(newItem);
        }

        cart.setUpdatedAt(System.currentTimeMillis());
        return cartRepository.save(cart);
    }

    public Cart getCart(String userEmail) {
        return getOrCreateCart(userEmail);
    }

    public Cart updateCartItem(String userEmail, Long productId, Integer quantity) {
        Cart cart = getOrCreateCart(userEmail);
        Optional<CartItem> item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId);

        if (item.isPresent()) {
            if (quantity <= 0) {
                cartItemRepository.delete(item.get());
            } else {
                item.get().setQuantity(quantity);
                item.get().setUpdatedAt(System.currentTimeMillis());
                cartItemRepository.save(item.get());
            }
        }

        cart.setUpdatedAt(System.currentTimeMillis());
        return cartRepository.save(cart);
    }

    public Cart removeFromCart(String userEmail, Long productId) {
        Cart cart = getOrCreateCart(userEmail);
        Optional<CartItem> item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId);

        if (item.isPresent()) {
            cartItemRepository.delete(item.get());
        }

        cart.setUpdatedAt(System.currentTimeMillis());
        return cartRepository.save(cart);
    }

    public void clearCart(String userEmail) {
        Optional<Cart> cart = cartRepository.findByUserEmail(userEmail);
        if (cart.isPresent()) {
            cart.get().getItems().clear();
            cartRepository.save(cart.get());
        }
    }

    public CheckoutResponse checkout(String userEmail) {
        Cart cart = getOrCreateCart(userEmail);

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cart is empty. Add items before checkout.");
        }

        CheckoutResponse response = new CheckoutResponse();
        response.setOrderId("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        response.setUserEmail(userEmail);
        response.setTotalItems(cart.getTotalItems());
        response.setTotalPrice(cart.getTotalPrice());
        response.setCheckoutAt(System.currentTimeMillis());
        response.setMessage("Checkout completed successfully");

        cart.getItems().clear();
        cart.setUpdatedAt(System.currentTimeMillis());
        cartRepository.save(cart);

        return response;
    }
}
