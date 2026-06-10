package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutResponse {
    private String orderId;
    private String userEmail;
    private String status;
    private Integer totalItems;
    private Double itemsTotal;
    private Double gstAmount;
    private Double shippingCost;
    private Double finalAmount;
    private Double totalPrice;
    private Long checkoutAt;
    private String message;
}
