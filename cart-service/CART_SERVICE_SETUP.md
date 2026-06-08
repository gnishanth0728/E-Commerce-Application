# Cart Service Setup Guide

## Overview
The cart service has been fully integrated into the E-Commerce application. It handles shopping cart operations with JWT authentication, persistent storage, and seamless integration with the frontend and Nginx reverse proxy.

## Architecture
```
Browser → Nginx (port 80) → Cart Service (port 8082, internally accessible)
         ↓
    Frontend calls:
    - GET /api/cart (get cart)
    - POST /api/cart/add (add item)
    - PUT /api/cart/update/{productId} (update quantity)
    - DELETE /api/cart/remove/{productId} (remove item)
    - DELETE /api/cart/clear (clear all items)
```

## Backend Components

### Database (MySQL)
- **Database**: `ecommerce_cart`
- **Port**: 3307 (mapped from 3306)
- **Tables**:
  - `carts` - User cart records
  - `cart_items` - Individual cart items

### Cart Service (Spring Boot)
- **Port**: 8082
- **Language**: Java 21
- **Framework**: Spring Boot 3.5.3
- **Features**:
  - JWT authentication validation
  - Cart management (CRUD operations)
  - Quantity updates
  - Item removal
  - Cart clearing
  - Automatic timestamps

### API Endpoints

#### Get Cart
```bash
GET /api/cart
Header: Authorization: Bearer <JWT_TOKEN>
Response: { id, userEmail, items: [...], totalPrice, totalItems }
```

#### Add to Cart
```bash
POST /api/cart/add
Header: Authorization: Bearer <JWT_TOKEN>
Body: {
  "productId": 1,
  "productName": "Product Name",
  "price": 99.99,
  "quantity": 1,
  "imageUrl": "https://..."
}
Response: Updated cart object
```

#### Update Quantity
```bash
PUT /api/cart/update/{productId}?quantity=2
Header: Authorization: Bearer <JWT_TOKEN>
Response: Updated cart object
```

#### Remove Item
```bash
DELETE /api/cart/remove/{productId}
Header: Authorization: Bearer <JWT_TOKEN>
Response: Updated cart object
```

#### Clear Cart
```bash
DELETE /api/cart/clear
Header: Authorization: Bearer <JWT_TOKEN>
Response: Empty response (204)
```

## Frontend Integration

### New Files Created
1. **cartApi.ts** - Axios instance for cart API calls with JWT token injection
2. **CartPage.tsx** - Full shopping cart page with:
   - Display cart items with images
   - Quantity controls (+ / - buttons)
   - Item removal
   - Subtotal calculation
   - Order summary with total price
   - Empty cart state
   - Checkout button (placeholder)

### Updated Files
1. **Home.tsx**:
   - Import shopping cart icon
   - Add "Add to Cart" button on products
   - Shopping cart icon link in header (for logged-in users)
   - Toast notifications for cart actions
   - Handles unauthorized users (redirects to login)

2. **AppRoutes.tsx**:
   - Added `/cart` route pointing to CartPage

3. **vite.config.ts**:
   - Added `/api/cart` proxy for development (localhost:8082)

## Deployment Steps

### 1. Build and Start Cart Service

```bash
cd /home/udz1kor/E-Commerce-Application/cart-service
docker compose down
docker compose up -d --build
```

This will:
- Build the cart service Docker image
- Start MySQL database for cart data
- Start the Spring Boot cart service on port 8082
- Initialize the database with tables

### 2. Rebuild Frontend (to include new cart features)

```bash
cd /home/udz1kor/E-Commerce-Application/frontend
docker compose down
docker compose up -d --build
```

### 3. Verify Services Are Running

```bash
# Check all containers
docker ps

# Expected output should show:
# - cart-db (MySQL)
# - cart-service (Spring Boot)
# - nginx / frontend
# - auth-service (if running)
# - product-db (MySQL)
# - product-service (Spring Boot)
```

### 4. Verify Nginx Configuration

```bash
# Verify Nginx has the cart route
docker exec <nginx-container> cat /etc/nginx/conf.d/default.conf | grep -A 6 "api/cart"
```

Expected output:
```nginx
location /api/cart/ {
    proxy_pass http://host.docker.internal:8082;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Testing the Cart Service

### 1. Manual Test - Add Product to Cart

```bash
# Get a JWT token first (from login)
TOKEN="<your-jwt-token>"

# Get current cart
curl -X GET "http://18.207.151.13/api/cart/" \
  -H "Authorization: Bearer $TOKEN"

# Add a product to cart
curl -X POST "http://18.207.151.13/api/cart/add" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "productName": "Sample Product",
    "price": 99.99,
    "quantity": 1,
    "imageUrl": "https://picsum.photos/300/200"
  }'

# Update quantity
curl -X PUT "http://18.207.151.13/api/cart/update/1?quantity=3" \
  -H "Authorization: Bearer $TOKEN"

# Remove item
curl -X DELETE "http://18.207.151.13/api/cart/remove/1" \
  -H "Authorization: Bearer $TOKEN"

# Clear cart
curl -X DELETE "http://18.207.151.13/api/cart/clear" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. UI Test - Using Browser

1. Navigate to `http://18.207.151.13`
2. Login with your credentials
3. Browse products
4. Click "Add To Cart" button on any product
5. See toast notification confirming item added
6. Click shopping cart icon in header
7. Verify cart page shows items with:
   - Product image and name
   - Price and quantity
   - Subtotal calculation
   - Order summary with total
   - Quantity increase/decrease buttons
   - Remove item option

## Troubleshooting

### Cart Service Not Starting
```bash
# Check logs
docker logs cart-service

# Common issues:
# - Port 8082 already in use: docker ps | grep 8082
# - Database connection: Check SPRING_DATASOURCE_URL environment variable
# - Maven build failed: Check Java version (must be 21)
```

### Items Not Persisting
```bash
# Check MySQL database
docker exec cart-db mysql -uroot -proot -e "USE ecommerce_cart; SELECT * FROM carts; SELECT * FROM cart_items;"

# Verify MySQL is running
docker logs cart-db
```

### Cart Page 401 Unauthorized
- Verify JWT token is being sent in Authorization header
- Check token hasn't expired
- Ensure user is logged in before accessing cart

### "Add to Cart" Button Not Working
- Check browser console (F12) for errors
- Verify JWT token is stored in localStorage
- Ensure cart-service is running: `docker ps | grep cart-service`
- Check Nginx routing: See "Verify Nginx Configuration" section above

## Database Schema

### carts table
```sql
CREATE TABLE carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    INDEX idx_user_email (user_email)
);
```

### cart_items table
```sql
CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    image_url VARCHAR(500),
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    INDEX idx_cart_id (cart_id),
    INDEX idx_product_id (product_id),
    UNIQUE KEY unique_cart_product (cart_id, product_id)
);
```

## Security Features

- **JWT Authentication**: All cart endpoints require valid JWT token
- **User Isolation**: Each user has their own cart (identified by email in JWT)
- **CORS Protection**: Limited to frontend origins
- **Database Constraints**: Unique constraint on (cart_id, product_id) prevents duplicate items
- **Input Validation**: Quantity and price validation via Spring Security
- **Internal-Only**: Cart service only accessible through Nginx reverse proxy

## Performance Considerations

- **Eager Loading**: Cart items loaded eagerly with cart to reduce database queries
- **Indexes**: Created on user_email, cart_id, and product_id for fast lookups
- **Unique Constraints**: Prevents duplicate entries in same cart
- **Timestamps**: createdAt and updatedAt for audit trail

## Future Enhancements

1. **Wishlist Feature**: Mark items for later
2. **Cart Expiry**: Auto-clear abandoned carts after 30 days
3. **Price Tracking**: Monitor price changes for cart items
4. **Checkout Integration**: Connect to payment gateway
5. **Order History**: Convert cart to order after checkout
6. **Cart Sharing**: Share cart with others
7. **Bulk Operations**: Add multiple items at once
8. **Cart Recovery**: Recover deleted carts
