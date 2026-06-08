package com.ecommerce.products.controller;

import com.ecommerce.products.entity.Product;
import com.ecommerce.products.repository.ProductRepository;
import com.ecommerce.products.service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin("*")
public class ProductController {

    private final ProductRepository repository;
    private final ProductService productService;

    public ProductController(
            ProductRepository repository,
            ProductService productService) {

        this.repository = repository;
        this.productService = productService;
    }

    @GetMapping
    public List<Product> getAll() {

        return repository.findAll();
    }

    @GetMapping("/category/{id}")
    public List<Product> getByCategory(
            @PathVariable Long id) {

        return repository
                .findByCategoryId(id);
    }

    @GetMapping("/search")
    public List<Product> search(
            @RequestParam String keyword) {

        return productService
                .searchProducts(
                        keyword);
        }

        @GetMapping("/filter")
        public List<Product> filter(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword) {

        return productService
            .filterProducts(
                categoryId,
                keyword);
        }

    @PostMapping
    public Product create(
            @RequestBody Product product) {

        return repository.save(product);
    }
}
