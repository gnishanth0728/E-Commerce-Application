CREATE DATABASE IF NOT EXISTS ecommerce_order;
USE ecommerce_order;

CREATE TABLE IF NOT EXISTS orders (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	order_id VARCHAR(255) NOT NULL UNIQUE,
	user_email VARCHAR(255) NOT NULL,
	status VARCHAR(64) NOT NULL,
	total_items INT NOT NULL,
	total_price DECIMAL(10, 2) NOT NULL,
	checkout_at BIGINT NOT NULL,
	INDEX idx_user_email_checkout (user_email, checkout_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	order_ref BIGINT NOT NULL,
	product_id BIGINT NOT NULL,
	product_name VARCHAR(255) NOT NULL,
	price DECIMAL(10, 2) NOT NULL,
	quantity INT NOT NULL,
	image_url VARCHAR(500),
	total_price DECIMAL(10, 2) NOT NULL,
	FOREIGN KEY (order_ref) REFERENCES orders(id) ON DELETE CASCADE,
	INDEX idx_order_ref (order_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS saved_cards (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	user_email VARCHAR(255) NOT NULL UNIQUE,
	card_holder_name VARCHAR(255) NOT NULL,
	card_number VARCHAR(25) NOT NULL,
	expiry_date VARCHAR(5) NOT NULL,
	updated_at BIGINT NOT NULL,
	INDEX idx_saved_card_user_email (user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
