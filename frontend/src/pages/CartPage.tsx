import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useNavigate } from "react-router-dom";
import { clearCart, getCart, removeFromCart, updateCartItem } from "../api/cartApi";

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Cart {
  id: number;
  userEmail: string;
  items: CartItem[];
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await getCart();
      setCart(response.data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Please login to view your cart");
        navigate("/login");
      } else {
        setError("Failed to load cart");
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadCart(true);
  }, []);

  const handleRemoveItem = async (productId: number) => {
    try {
      await removeFromCart(productId);
      await loadCart(false);
    } catch {
      setError("Failed to remove item from cart");
    }
  };

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await handleRemoveItem(productId);
      return;
    }

    try {
      await updateCartItem(productId, quantity);
      await loadCart(false);
    } catch {
      setError("Failed to update quantity");
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      await loadCart(false);
    } catch {
      setError("Failed to clear cart");
    }
  };

  const totalItems = cart?.items?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) || 0;
  const itemBill = cart?.items?.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0) || 0;

  if (loading && !cart) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5">Loading cart...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 4,
          background: "linear-gradient(135deg, #1e3a8a 0%, #2874f0 45%, #60a5fa 100%)",
          color: "white",
          boxShadow: "0 18px 40px rgba(40, 116, 240, 0.25)",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Shopping Cart
        </Typography>
        <Typography sx={{ opacity: 0.92 }}>
          Update quantities, review order summary, then continue to secure payment.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cart && cart.items.length > 0 ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {cart.items.map((item: CartItem) => (
              <Card
                key={item.id}
                sx={{
                  mb: 2,
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  borderRadius: 3,
                  border: "1px solid #dbe7ff",
                  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
                  overflow: "hidden",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 18px 34px rgba(15, 23, 42, 0.12)",
                  },
                }}
              >
                {item.imageUrl && (
                  <CardMedia
                    component="img"
                    sx={{
                      width: { xs: "100%", sm: 180 },
                      height: { xs: 180, sm: "auto" },
                      objectFit: "cover",
                    }}
                    image={item.imageUrl}
                    alt={item.productName}
                  />
                )}

                <Box sx={{ flex: 1, p: 2.25 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
                      {item.productName}
                    </Typography>
                    <Chip
                      size="small"
                      label={`Qty ${item.quantity}`}
                      sx={{ bgcolor: "#e8f0ff", color: "#1d4ed8", fontWeight: 700 }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: "#334155", mb: 1.5, fontWeight: 600 }}>
                    Unit Price: ₹{item.price.toFixed(2)}
                  </Typography>

                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1,
                      py: 0.5,
                      borderRadius: 999,
                      border: "1px solid #dbe7ff",
                      bgcolor: "#f8fbff",
                      mb: 1.5,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => void handleUpdateQuantity(item.productId, item.quantity - 1)}
                      sx={{ border: "1px solid #d1d5db" }}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ minWidth: 24, textAlign: "center", fontWeight: 800 }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => void handleUpdateQuantity(item.productId, item.quantity + 1)}
                      sx={{ border: "1px solid #d1d5db" }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: "#ea580c" }}>
                      Subtotal: ₹{(item.price * item.quantity).toFixed(2)}
                    </Typography>

                    <Button
                      variant="text"
                      color="error"
                      startIcon={<DeleteIcon />}
                      sx={{ px: 0, fontWeight: 700 }}
                      onClick={() => void handleRemoveItem(item.productId)}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              </Card>
            ))}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              sx={{
                p: 3,
                position: "sticky",
                top: 20,
                borderRadius: 3,
                border: "1px solid #e5eefc",
                boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Order Summary</Typography>

              <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: "#f8fbff", border: "1px solid #e7efff" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: "#334155" }}>Item Bill ({totalItems})</Typography>
                  <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>₹{itemBill.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ color: "#334155" }}>GST + Shipping</Typography>
                  <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Calculated at checkout</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Typography sx={{ mb: 1.25, fontWeight: 700, color: "#0f172a" }}>Cart Items</Typography>
              <Box
                sx={{
                  mb: 2,
                  maxHeight: 220,
                  overflow: "auto",
                  pr: 0.5,
                  display: "grid",
                  gap: 1,
                }}
              >
                {cart.items.map((item: CartItem) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      bgcolor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#1e293b", fontWeight: 600 }}>
                      {item.productName} x {item.quantity}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 700 }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fb641b" }}>
                  ₹{itemBill.toFixed(2)}+
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/checkout/payment")}
                sx={{ bgcolor: "#2874f0", mb: 1, "&:hover": { bgcolor: "#1c52a8" } }}
              >
                Continue to Payment
              </Button>

              <Button variant="outlined" fullWidth sx={{ mb: 1 }} onClick={() => navigate("/")}>
                Continue Shopping
              </Button>

              <Button variant="text" fullWidth color="error" onClick={() => void handleClearCart()}>
                Clear Cart
              </Button>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Your cart is empty</Typography>
          <Button variant="contained" onClick={() => navigate("/")} sx={{ bgcolor: "#2874f0" }}>
            Start Shopping
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default CartPage;
