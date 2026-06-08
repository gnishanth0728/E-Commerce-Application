package com.ecommerce.products.repository;

import com.ecommerce.products.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    List<Product>
    findByCategoryId(Long categoryId);

    List<Product>
    findByNameContainingIgnoreCase(
        String keyword);

        @Query("""
                SELECT p FROM Product p
                WHERE (:categoryId IS NULL OR p.category.id = :categoryId)
                    AND (
                                :keyword IS NULL
                                OR :keyword = ''
                                OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
                            )
                """)
        List<Product> filterProducts(
                        @Param("categoryId") Long categoryId,
                        @Param("keyword") String keyword);
}
