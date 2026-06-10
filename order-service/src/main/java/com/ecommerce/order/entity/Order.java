package com.ecommerce.order.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderId;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String status;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false)
    private Integer totalItems;

    @Column(nullable = false)
    private Double totalPrice;

    @Column(nullable = false)
    private Double gstAmount;

    @Column(nullable = false)
    private Double shippingCost;

    @Column(nullable = false)
    private Double finalAmount;

    @Column(nullable = false)
    private String doorNumber;

    @Column(nullable = false)
    private String flatAddress;

    @Column(nullable = false)
    private String lane;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String postalCode;

    @Column(nullable = false)
    private Double distanceKm;

    @Column(nullable = false)
    private Long checkoutAt;
}
