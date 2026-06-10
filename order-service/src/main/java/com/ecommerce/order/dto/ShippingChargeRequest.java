package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShippingChargeRequest {
    private String doorNumber;
    private String flatAddress;
    private String lane;
    private String city;
    private String postalCode;
}
