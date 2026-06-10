CREATE DATABASE IF NOT EXISTS ecommerce_shipping;
USE ecommerce_shipping;

CREATE TABLE IF NOT EXISTS india_locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    distance_km DOUBLE NOT NULL,
    UNIQUE KEY uniq_city_postal (city, postal_code),
    INDEX idx_postal_code (postal_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO india_locations (city, postal_code, distance_km) VALUES
('Bengaluru', '560001', 8),
('Bengaluru', '560103', 14),
('Hyderabad', '500001', 42),
('Chennai', '600001', 62),
('Mumbai', '400001', 118),
('Pune', '411001', 96),
('Kolkata', '700001', 210),
('Delhi', '110001', 225),
('Ahmedabad', '380001', 160),
('Jaipur', '302001', 185)
ON DUPLICATE KEY UPDATE distance_km = VALUES(distance_km);
