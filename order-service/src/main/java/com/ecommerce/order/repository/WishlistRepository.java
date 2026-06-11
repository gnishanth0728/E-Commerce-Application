package com.ecommerce.order.repository;

import com.ecommerce.order.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    
    Optional<Wishlist> findByUserEmailAndProductId(String userEmail, Long productId);
    
    void deleteByUserEmailAndProductId(String userEmail, Long productId);
    
    boolean existsByUserEmailAndProductId(String userEmail, Long productId);
}
