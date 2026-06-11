import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  Button,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getOrderHistory } from "../api/orderApi";

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string;
}

interface Order {
  id: number;
  orderId: string;
  userEmail: string;
  status: string;
  totalItems: number;
  totalPrice: number;
  gstAmount: number;
  shippingCost: number;
  finalAmount: number;
  doorNumber: string;
  flatAddress: string;
  lane: string;
  city: string;
  postalCode: string;
  distanceKm: number;
  checkoutAt: number;
  items: OrderItem[];
}

interface OrderHistoryResponse {
  userEmail: string;
  orders: Order[];
}

const derivePaymentStatus = (orderStatus: string): string => {
  const normalized = orderStatus?.toUpperCase() || "";
  if (["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"].includes(normalized)) {
    return "SUCCESS";
  }
  if (normalized.includes("PAYMENT_FAILED")) {
    return "FAILED";
  }
  return "PENDING";
};

const deriveShippingStatus = (orderStatus: string): string => {
  const normalized = orderStatus?.toUpperCase() || "";
  if (["SHIPPED", "DELIVERED"].includes(normalized)) {
    return normalized;
  }
  return "PENDING";
};

const deriveOrderConfirmationStatus = (orderStatus: string): string => {
  const normalized = orderStatus?.toUpperCase() || "";
  if (["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"].includes(normalized)) {
    return "CONFIRMED";
  }
  return normalized || "PENDING";
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrderHistory();
      const payload: OrderHistoryResponse = response.data;
      setOrders(payload.orders || []);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Please login to view your order history");
        navigate("/login");
      } else {
        setError("Failed to load order history");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4">Loading orders...</Typography>
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Order History
            </Typography>
            <Typography sx={{ opacity: 0.92 }}>
              Review each payment success, shipping charge, and final bill in a single timeline.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate("/")}
            sx={{
              bgcolor: "white",
              color: "#1e3a8a",
              fontWeight: 700,
              px: 2.5,
              "&:hover": { bgcolor: "#eaf2ff" },
            }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {orders.length === 0 ? (
        <Card sx={{ borderRadius: 4, textAlign: "center", boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)" }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              No previous orders found.
            </Typography>
            <Typography color="text.secondary">
              Once you place an order, the payment confirmation, shipping status, and final bill will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {orders.map((order: Order) => {
            const paymentStatus = derivePaymentStatus(order.status);
            const shippingStatus = deriveShippingStatus(order.status);
            const orderConfirmationStatus = deriveOrderConfirmationStatus(order.status);

            return (
              <Grid size={{ xs: 12 }} key={order.id}>
                <Card
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    border: "1px solid #e5eefc",
                    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <Box sx={{ height: 8, background: "linear-gradient(90deg, #2874f0 0%, #22c55e 100%)" }} />
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                          {order.orderId}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {new Date(order.checkoutAt).toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={`Payment ${paymentStatus}`}
                          color={paymentStatus === "SUCCESS" ? "success" : paymentStatus === "FAILED" ? "error" : "default"}
                        />
                        <Chip
                          label={`Shipping ${shippingStatus}`}
                          color={shippingStatus === "PENDING" ? "default" : "info"}
                        />
                        <Chip
                          label={`Order ${orderConfirmationStatus}`}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fbff", height: "100%" }}>
                          <Typography sx={{ fontWeight: 800, mb: 1 }}>Payment Summary</Typography>
                          <Typography variant="body2">Items: {order.totalItems}</Typography>
                          <Typography variant="body2">Item Bill: ₹{Number(order.totalPrice).toFixed(2)}</Typography>
                          <Typography variant="body2">GST: ₹{Number(order.gstAmount).toFixed(2)}</Typography>
                          <Typography variant="body2">Shipping: ₹{Number(order.shippingCost).toFixed(2)}</Typography>
                          <Divider sx={{ my: 1.5 }} />
                          <Typography sx={{ fontWeight: 800, color: "#0f4c81" }}>
                            Final Bill: ₹{Number(order.finalAmount).toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, color: "#166534", fontWeight: 700 }}>
                            Payment Success: YES
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#fffaf2", height: "100%" }}>
                          <Typography sx={{ fontWeight: 800, mb: 1 }}>Shipping</Typography>
                          <Typography variant="body2">Address: {order.doorNumber}, {order.flatAddress}</Typography>
                          <Typography variant="body2">Lane: {order.lane}</Typography>
                          <Typography variant="body2">City: {order.city}</Typography>
                          <Typography variant="body2">PIN: {order.postalCode}</Typography>
                          <Divider sx={{ my: 1.5 }} />
                          <Typography variant="body2">Distance: {Number(order.distanceKm).toFixed(2)} km</Typography>
                          <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
                            Shipping Status: {shippingStatus}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#f9fafb", height: "100%" }}>
                          <Typography sx={{ fontWeight: 800, mb: 1 }}>Items</Typography>
                          <Box sx={{ display: "grid", gap: 1 }}>
                            {order.items.map((item: OrderItem) => (
                              <Box
                                key={item.id}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 2,
                                  p: 1.25,
                                  borderRadius: 2,
                                  bgcolor: "white",
                                  border: "1px solid #edf2f7",
                                }}
                              >
                                <Box>
                                  <Typography sx={{ fontWeight: 700 }}>{item.productName}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Qty {item.quantity} x ₹{Number(item.price).toFixed(2)}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 700 }}>
                                  ₹{Number(item.totalPrice).toFixed(2)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default OrdersPage;
