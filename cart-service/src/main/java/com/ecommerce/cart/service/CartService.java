package com.ecommerce.cart.service;

import com.ecommerce.cart.dto.AddToCartRequest;
import com.ecommerce.cart.dto.CheckoutResponse;
import com.ecommerce.cart.entity.Order;
import com.ecommerce.cart.entity.OrderItem;
import com.ecommerce.cart.entity.Cart;
import com.ecommerce.cart.entity.CartItem;
import com.ecommerce.cart.repository.CartItemRepository;
import com.ecommerce.cart.repository.CartRepository;
import com.ecommerce.cart.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Value("${payment.service.url}")
    private String paymentServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private void processPayment(String orderId, String userEmail, Integer totalItems, Double totalPrice) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> payload = new HashMap<>();
            payload.put("orderId", orderId);
            payload.put("userEmail", userEmail);
            payload.put("totalItems", totalItems);
            payload.put("amount", totalPrice);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(paymentServiceUrl, request, Map.class);
            Object status = response.getBody() != null ? response.getBody().get("status") : null;

            if (!response.getStatusCode().is2xxSuccessful() || status == null || !"SUCCESS".equalsIgnoreCase(status.toString())) {
                throw new IllegalStateException("Payment failed. Please try again.");
            }
        } catch (RestClientException ex) {
            throw new IllegalStateException("Payment service unavailable. Please try again.");
        }
    }

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
                if (cart.getItems() != null) {
                    cart.getItems().removeIf(cartItem -> cartItem.getProductId().equals(productId));
                }
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
        if (cart.getItems() != null) {
            cart.getItems().removeIf(item -> item.getProductId().equals(productId));
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

    public List<Order> getOrderHistory(String userEmail) {
        return orderRepository.findByUserEmailOrderByCheckoutAtDesc(userEmail);
    }

    public CheckoutResponse checkout(String userEmail) {
        Cart cart = getOrCreateCart(userEmail);

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cart is empty. Add items before checkout.");
        }

        String generatedOrderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        processPayment(generatedOrderId, userEmail, cart.getTotalItems(), cart.getTotalPrice());

        Order order = new Order();
        order.setOrderId(generatedOrderId);
        order.setUserEmail(userEmail);
        order.setCheckoutAt(System.currentTimeMillis());
        order.setTotalItems(cart.getTotalItems());
        order.setTotalPrice(cart.getTotalPrice());

        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(cartItem.getProductId());
            orderItem.setProductName(cartItem.getProductName());
            orderItem.setPrice(cartItem.getPrice());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setImageUrl(cartItem.getImageUrl());
            orderItem.setTotalPrice(cartItem.getPrice() * cartItem.getQuantity());
            orderItems.add(orderItem);
        }
        order.setItems(orderItems);
        orderRepository.save(order);

        CheckoutResponse response = new CheckoutResponse();
        response.setOrderId(generatedOrderId);
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
