import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Divider,
  Card,
  CardMedia,
  IconButton,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  getCart,
  removeFromCart,
  updateCartItem,
  clearCart,
  checkoutCart,
} from "../api/cartApi";
import { useNavigate } from "react-router-dom";

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  totalPrice?: number;
}

interface Cart {
  id: number;
  userEmail: string;
  items: CartItem[];
  totalPrice?: number;
  totalItems?: number;
}

const CartPage: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      console.log("Calling getCart API...");
      const response = await getCart();
      console.log("API Response:", response);
      console.log("Cart data:", response.data);
      setCart(response.data);
      console.log("Cart state updated with items:", response.data?.items?.length || 0);
      setError(null);
    } catch (err: any) {
      console.error("Error loading cart:", err);
      console.error("Error details:", {
        status: err.response?.status,
        message: err.message,
        data: err.response?.data,
      });
      if (err.response?.status === 401) {
        setError("Please login to view your cart");
        navigate("/login");
      } else {
        setError("Failed to load cart: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      await removeFromCart(productId);
      loadCart();
    } catch (err) {
      setError("Failed to remove item from cart");
    }
  };

  const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    try {
      await updateCartItem(productId, newQuantity);
      loadCart();
    } catch (err) {
      setError("Failed to update quantity");
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      loadCart();
    } catch (err) {
      setError("Failed to clear cart");
    }
  };

  const handleCheckout = async () => {
    try {
      setError(null);
      const response = await checkoutCart();
      const checkoutData = response.data;
      setSuccessMessage(
        `Order ${checkoutData.orderId} placed successfully for ₹${Number(
          checkoutData.totalPrice || 0
        ).toFixed(2)}`
      );
      await loadCart();
    } catch (err: any) {
      setSuccessMessage(null);
      setError(err.response?.data?.message || "Checkout failed");
    }
  };

  const calculateTotalPrice = () => {
    return cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  };

  const calculateTotalItems = () => {
    return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4">Loading cart...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 3, fontWeight: "bold" }}>
        🛒 Shopping Cart
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      {cart && cart.items && cart.items.length > 0 ? (
        <Grid container spacing={3}>
          {/* Cart Items */}
          <Grid size={{ xs: 12, md: 8 }}>
            {cart.items.map((item) => (
              <Card key={item.id} sx={{ mb: 2, display: "flex" }}>
                {item.imageUrl && (
                  <CardMedia
                    component="img"
                    sx={{ width: 150, height: 150, objectFit: "cover" }}
                    image={item.imageUrl}
                    alt={item.productName}
                  />
                )}
                <Box sx={{ flex: 1, p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {item.productName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#2874f0", my: 1 }}>
                    Price: ₹{item.price}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, my: 2 }}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleUpdateQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      <RemoveIcon />
                    </IconButton>
                    <TextField
                      type="number"
                      size="small"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateQuantity(
                          item.productId,
                          parseInt(e.target.value) || 1
                        )
                      }
                      sx={{ width: 60, textAlign: "center" }}
                    />
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleUpdateQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body1" sx={{ fontWeight: "bold", color: "#fb641b" }}>
                    Subtotal: ₹{(item.price * item.quantity).toFixed(2)}
                  </Typography>

                  <IconButton
                    color="error"
                    onClick={() => handleRemoveItem(item.productId)}
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon /> Remove
                  </IconButton>
                </Box>
              </Card>
            ))}
          </Grid>

          {/* Order Summary */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, position: "sticky", top: 20 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Order Summary
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography>Items ({calculateTotalItems()})</Typography>
                  <Typography>₹{calculateTotalPrice().toFixed(2)}</Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Shipping</Typography>
                  <Typography sx={{ color: "green" }}>FREE</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Total
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#fb641b" }}
                >
                  ₹{calculateTotalPrice().toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleCheckout}
                sx={{
                  bgcolor: "#2874f0",
                  mb: 1,
                  "&:hover": { bgcolor: "#1c52a8" },
                }}
              >
                Proceed to Checkout
              </Button>

              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 1 }}
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </Button>

              <Button
                variant="text"
                fullWidth
                color="error"
                onClick={handleClearCart}
              >
                Clear Cart
              </Button>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Your cart is empty
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/")}
            sx={{ bgcolor: "#2874f0" }}
          >
            Start Shopping
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default CartPage;
