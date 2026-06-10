package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShippingChargeResponse {
    private String status;
    private String doorNumber;
    private String flatAddress;
    private String lane;
    private String city;
    private String postalCode;
    private Double distanceKm;
    private Double shippingCost;
}
