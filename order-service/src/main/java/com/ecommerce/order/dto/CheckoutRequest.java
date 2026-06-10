package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {
    private String cardHolderName;
    private String cardNumber;
    private String expiryDate;
    private String cvv;
    private Boolean saveCard;
}
