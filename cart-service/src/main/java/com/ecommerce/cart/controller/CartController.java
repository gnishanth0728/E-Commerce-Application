package com.ecommerce.cart.controller;

import com.ecommerce.cart.dto.AddToCartRequest;
import com.ecommerce.cart.dto.CheckoutResponse;
import com.ecommerce.cart.dto.OrderHistoryResponse;
import com.ecommerce.cart.entity.Cart;
import com.ecommerce.cart.entity.Order;
import com.ecommerce.cart.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping({"", "/"})
    public Cart getCart(Authentication authentication) {
        String userEmail = (String) authentication.getPrincipal();
        return cartService.getCart(userEmail);
    }

    @PostMapping("/add")
    public Cart addToCart(Authentication authentication, @RequestBody AddToCartRequest request) {
        String userEmail = (String) authentication.getPrincipal();
        return cartService.addToCart(userEmail, request);
    }

    @PutMapping("/update/{productId}")
    public Cart updateCartItem(
            Authentication authentication,
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        String userEmail = (String) authentication.getPrincipal();
        return cartService.updateCartItem(userEmail, productId, quantity);
    }

    @DeleteMapping("/remove/{productId}")
    public Cart removeFromCart(Authentication authentication, @PathVariable Long productId) {
        String userEmail = (String) authentication.getPrincipal();
        return cartService.removeFromCart(userEmail, productId);
    }

    @DeleteMapping("/clear")
    public void clearCart(Authentication authentication) {
        String userEmail = (String) authentication.getPrincipal();
        cartService.clearCart(userEmail);
    }

    @PostMapping("/checkout")
    public CheckoutResponse checkout(Authentication authentication) {
        String userEmail = (String) authentication.getPrincipal();
        try {
            return cartService.checkout(userEmail);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @GetMapping("/orders")
    public OrderHistoryResponse getOrderHistory(Authentication authentication) {
        String userEmail = (String) authentication.getPrincipal();
        List<Order> orders = cartService.getOrderHistory(userEmail);
        return new OrderHistoryResponse(userEmail, orders);
    }
}
