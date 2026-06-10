package com.ecommerce.order.repository;

import com.ecommerce.order.entity.SavedCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavedCardRepository extends JpaRepository<SavedCard, Long> {
    Optional<SavedCard> findByUserEmail(String userEmail);
}
