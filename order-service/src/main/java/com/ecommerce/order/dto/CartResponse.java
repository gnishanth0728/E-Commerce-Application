package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    private Long id;
    private String userEmail;
    private List<CartItemPayload> items;
    private Double totalPrice;
    private Integer totalItems;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemPayload {
        private Long id;
        private Long productId;
        private String productName;
        private Double price;
        private Integer quantity;
        private String imageUrl;
    }
}
