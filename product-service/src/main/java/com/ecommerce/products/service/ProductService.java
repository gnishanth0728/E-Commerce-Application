package com.ecommerce.products.service;

import com.ecommerce.products.entity.Product;
import com.ecommerce.products.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository
            productRepository;

    public ProductService(
            ProductRepository productRepository) {

        this.productRepository =
                productRepository;
    }

    public List<Product> getProducts() {

        return productRepository.findAll();
    }

    public List<Product> searchProducts(
            String keyword) {

        return productRepository
                .findByNameContainingIgnoreCase(
                        keyword);
    }

    public List<Product> filterProducts(
            Long categoryId,
            String keyword) {

        return productRepository
                .filterProducts(
                        categoryId,
                        keyword);
    }
}
