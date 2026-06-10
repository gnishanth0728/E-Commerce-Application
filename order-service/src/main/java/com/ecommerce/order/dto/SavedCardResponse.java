package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SavedCardResponse {
    private String cardHolderName;
    private String cardNumber;
    private String expiryDate;
}
