package com.ecommerce.cart.repository;

import com.ecommerce.cart.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserEmailOrderByCheckoutAtDesc(String userEmail);
}
