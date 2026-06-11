package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderPreviewResponse {
    private Integer totalItems;
    private Double itemBill;
    private Double gstAmount;
    private Double shippingCost;
    private Double finalAmount;
}
