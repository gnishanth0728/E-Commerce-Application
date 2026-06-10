package com.ecommerce.order.controller;

import com.ecommerce.order.dto.CheckoutRequest;
import com.ecommerce.order.dto.CheckoutResponse;
import com.ecommerce.order.dto.OrderHistoryResponse;
import com.ecommerce.order.dto.SavedCardResponse;
import com.ecommerce.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/checkout")
    public CheckoutResponse checkout(
            Authentication authentication,
            @RequestBody CheckoutRequest request,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        String userEmail = (String) authentication.getPrincipal();
        try {
            return orderService.checkout(userEmail, authorizationHeader, request);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @GetMapping({"", "/"})
    public OrderHistoryResponse getOrderHistory(Authentication authentication) {
        String userEmail = (String) authentication.getPrincipal();
        return orderService.getOrderHistory(userEmail);
    }

    @GetMapping("/saved-card")
    public SavedCardResponse getSavedCard(Authentication authentication) {
        String userEmail = (String) authentication.getPrincipal();
        return orderService.getSavedCard(userEmail);
    }
}
