package com.ecommerce.order.service;

import com.ecommerce.order.dto.CartResponse;
import com.ecommerce.order.dto.CheckoutRequest;
import com.ecommerce.order.dto.CheckoutResponse;
import com.ecommerce.order.dto.OrderHistoryResponse;
import com.ecommerce.order.dto.ProductLookupResponse;
import com.ecommerce.order.dto.SavedCardResponse;
import com.ecommerce.order.dto.ShippingChargeRequest;
import com.ecommerce.order.dto.ShippingChargeResponse;
import com.ecommerce.order.entity.Order;
import com.ecommerce.order.entity.OrderItem;
import com.ecommerce.order.entity.SavedCard;
import com.ecommerce.order.repository.OrderRepository;
import com.ecommerce.order.repository.SavedCardRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
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
import java.util.Locale;

@Service
@Transactional
public class OrderService {

    private static final Logger LOGGER = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private SavedCardRepository savedCardRepository;

    @Value("${cart.service.url}")
    private String cartServiceUrl;

    @Value("${payment.service.url}")
    private String paymentServiceUrl;

        @Value("${shipping.service.url}")
        private String shippingServiceUrl;

        @Value("${product.service.url}")
        private String productServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

        private static final Map<String, Double> GST_BY_CATEGORY = Map.of(
            "electronics", 18.0,
            "fashion", 12.0,
            "grocery", 5.0,
            "books", 5.0,
            "beauty", 18.0
        );

    public CheckoutResponse checkout(String userEmail, String authorizationHeader, CheckoutRequest request) {
        validatePaymentRequest(request);
        CartResponse cart = fetchCart(authorizationHeader);

        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cart is empty. Add items before checkout.");
        }

        if (cart.getUserEmail() != null && !cart.getUserEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalStateException("Invalid checkout request for user cart.");
        }

        String generatedOrderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        long checkoutTime = System.currentTimeMillis();

        Order order = new Order();
        order.setOrderId(generatedOrderId);
        order.setUserEmail(userEmail);
        order.setStatus("PENDING_PAYMENT");
        order.setCheckoutAt(checkoutTime);
        order.setTotalItems(cart.getTotalItems());
        order.setTotalPrice(cart.getTotalPrice());

        List<OrderItem> orderItems = new ArrayList<>();
        double gstAmount = 0.0;
        for (CartResponse.CartItemPayload cartItem : cart.getItems()) {
            ProductLookupResponse product = fetchProductById(cartItem.getProductId());
            String categoryName = product != null && product.getCategory() != null && product.getCategory().getName() != null
                    ? product.getCategory().getName()
                    : "others";
            double gstRate = getGstRateForCategory(categoryName);
            double itemTotal = cartItem.getPrice() * cartItem.getQuantity();
            double itemGstAmount = (itemTotal * gstRate) / 100.0;
            gstAmount += itemGstAmount;

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(cartItem.getProductId());
            orderItem.setProductName(cartItem.getProductName());
            orderItem.setPrice(cartItem.getPrice());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setCategoryName(categoryName);
            orderItem.setGstRate(gstRate);
            orderItem.setImageUrl(cartItem.getImageUrl());
            orderItem.setTotalPrice(itemTotal);
            orderItems.add(orderItem);
        }

        ShippingChargeResponse shipping = calculateShipping(request);
        double shippingCost = shipping.getShippingCost() == null ? 0.0 : shipping.getShippingCost();
        double finalAmount = cart.getTotalPrice() + gstAmount + shippingCost;

        order.setGstAmount(gstAmount);
        order.setShippingCost(shippingCost);
        order.setFinalAmount(finalAmount);
        order.setDoorNumber(request.getDoorNumber());
        order.setFlatAddress(request.getFlatAddress());
        order.setLane(request.getLane());
        order.setCity(request.getCity());
        order.setPostalCode(request.getPostalCode());
        order.setDistanceKm(shipping.getDistanceKm());

        order.setItems(orderItems);
        orderRepository.save(order);

        processPayment(order, request);
        order.setStatus("PLACED");
        orderRepository.save(order);

        if (Boolean.TRUE.equals(request.getSaveCard())) {
            upsertSavedCard(userEmail, request);
        }

        clearCart(authorizationHeader);

        return new CheckoutResponse(
                generatedOrderId,
                userEmail,
                "PLACED",
                order.getTotalItems(),
                order.getTotalPrice(),
                order.getGstAmount(),
                order.getShippingCost(),
                order.getFinalAmount(),
                order.getTotalPrice(),
                checkoutTime,
                "Payment successful and order placed"
        );
    }

    public OrderHistoryResponse getOrderHistory(String userEmail) {
        List<Order> orders = orderRepository.findByUserEmailOrderByCheckoutAtDesc(userEmail);
        return new OrderHistoryResponse(userEmail, orders);
    }

    public SavedCardResponse getSavedCard(String userEmail) {
        return savedCardRepository.findByUserEmail(userEmail)
                .map(savedCard -> new SavedCardResponse(
                        savedCard.getCardHolderName(),
                        savedCard.getCardNumber(),
                        savedCard.getExpiryDate()
                ))
                .orElse(null);
    }

    private CartResponse fetchCart(String authorizationHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authorizationHeader);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<CartResponse> response = restTemplate.exchange(
                    cartServiceUrl,
                    HttpMethod.GET,
                    entity,
                    CartResponse.class
            );
            return response.getBody();
        } catch (RestClientException ex) {
            throw new IllegalStateException("Cart service unavailable. Please try again.");
        }
    }

    private void clearCart(String authorizationHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authorizationHeader);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            restTemplate.exchange(cartServiceUrl + "/clear", HttpMethod.DELETE, entity, Void.class);
        } catch (RestClientException ex) {
            LOGGER.warn("Order created but cart clear failed: {}", ex.getMessage());
        }
    }

    private void processPayment(Order order, CheckoutRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", order.getOrderId());
        payload.put("userEmail", order.getUserEmail());
        payload.put("totalItems", order.getTotalItems());
        payload.put("amount", order.getFinalAmount());
        payload.put("cardHolderName", request.getCardHolderName());
        payload.put("cardNumber", request.getCardNumber());
        payload.put("expiryDate", request.getExpiryDate());
        payload.put("cvv", request.getCvv());

        HttpEntity<Map<String, Object>> paymentRequest = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(paymentServiceUrl, paymentRequest, Map.class);
            Object status = response.getBody() != null ? response.getBody().get("status") : null;

            if (!response.getStatusCode().is2xxSuccessful() || status == null || !"SUCCESS".equalsIgnoreCase(status.toString())) {
                throw new IllegalStateException("Payment failed. Order remains in PENDING_PAYMENT status.");
            }
        } catch (RestClientException ex) {
            throw new IllegalStateException("Payment service unavailable. Order remains in PENDING_PAYMENT status.");
        }
    }

    private void validatePaymentRequest(CheckoutRequest request) {
        if (request == null) {
            throw new IllegalStateException("Payment details are required.");
        }

        if (request.getCardHolderName() == null || request.getCardHolderName().trim().isEmpty()) {
            throw new IllegalStateException("Card holder name is required.");
        }

        if (request.getCardNumber() == null || !request.getCardNumber().replaceAll("\\s", "").matches("\\d{16}")) {
            throw new IllegalStateException("Card number must be 16 digits.");
        }

        if (request.getExpiryDate() == null || !request.getExpiryDate().matches("^(0[1-9]|1[0-2])/\\d{2}$")) {
            throw new IllegalStateException("Expiry must be in MM/YY format.");
        }

        if (request.getCvv() == null || !request.getCvv().matches("\\d{3}")) {
            throw new IllegalStateException("CVV must be 3 digits.");
        }

        if (request.getDoorNumber() == null || request.getDoorNumber().trim().isEmpty()) {
            throw new IllegalStateException("Door number is required.");
        }

        if (request.getFlatAddress() == null || request.getFlatAddress().trim().isEmpty()) {
            throw new IllegalStateException("Flat or street address is required.");
        }

        if (request.getLane() == null || request.getLane().trim().isEmpty()) {
            throw new IllegalStateException("Lane is required.");
        }

        if (request.getCity() == null || request.getCity().trim().isEmpty()) {
            throw new IllegalStateException("City is required.");
        }

        if (request.getPostalCode() == null || !request.getPostalCode().trim().matches("^[0-9]{6}$")) {
            throw new IllegalStateException("Postal code must be a valid 6 digit Indian PIN code.");
        }

    }

    private void upsertSavedCard(String userEmail, CheckoutRequest request) {
        Optional<SavedCard> existing = savedCardRepository.findByUserEmail(userEmail);
        SavedCard savedCard = existing.orElseGet(SavedCard::new);

        savedCard.setUserEmail(userEmail);
        savedCard.setCardHolderName(request.getCardHolderName());
        savedCard.setCardNumber(request.getCardNumber());
        savedCard.setExpiryDate(request.getExpiryDate());
        savedCard.setUpdatedAt(System.currentTimeMillis());

        savedCardRepository.save(savedCard);
    }

    private ProductLookupResponse fetchProductById(Long productId) {
        try {
            ResponseEntity<ProductLookupResponse> response = restTemplate.getForEntity(
                    productServiceUrl + "/" + productId,
                    ProductLookupResponse.class
            );
            return response.getBody();
        } catch (RestClientException ex) {
            return null;
        }
    }

    private double getGstRateForCategory(String categoryName) {
        String key = categoryName == null ? "others" : categoryName.toLowerCase(Locale.ROOT);
        return GST_BY_CATEGORY.getOrDefault(key, 18.0);
    }

    private ShippingChargeResponse calculateShipping(CheckoutRequest request) {
        ShippingChargeRequest shippingRequest = new ShippingChargeRequest(
                request.getDoorNumber(),
                request.getFlatAddress(),
                request.getLane(),
                request.getCity(),
            request.getPostalCode()
        );

        try {
            ResponseEntity<ShippingChargeResponse> response = restTemplate.postForEntity(
                    shippingServiceUrl,
                    shippingRequest,
                    ShippingChargeResponse.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("Shipping cost calculation failed.");
            }
            return response.getBody();
        } catch (RestClientException ex) {
            throw new IllegalStateException("Shipping service unavailable. Please try again.");
        }
    }
}
