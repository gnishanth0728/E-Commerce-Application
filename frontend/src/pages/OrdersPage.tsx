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

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Order History
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/")}>
          Continue Shopping
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {orders.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6">No previous orders found.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {orders.map((order) => (
            <Grid size={{ xs: 12 }} key={order.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {order.orderId}
                    </Typography>
                    <Typography color="text.secondary">
                      {new Date(order.checkoutAt).toLocaleString()}
                    </Typography>
                  </Box>

                  <Typography sx={{ mb: 1 }}>
                    Status: {order.status} | Items: {order.totalItems}
                  </Typography>

                  <Typography sx={{ mb: 1 }}>
                    Items Total: ₹{Number(order.totalPrice).toFixed(2)} | GST: ₹{Number(order.gstAmount).toFixed(2)} | Shipping: ₹{Number(order.shippingCost).toFixed(2)}
                  </Typography>

                  <Typography sx={{ mb: 1, fontWeight: "bold" }}>
                    Final Bill: ₹{Number(order.finalAmount).toFixed(2)}
                  </Typography>

                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    Shipping Address: {order.doorNumber}, {order.flatAddress}, {order.lane}, {order.city} - {order.postalCode}
                  </Typography>

                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    Distance: {Number(order.distanceKm).toFixed(2)} km
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  {order.items.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        py: 0.5,
                      }}
                    >
                      <Typography>
                        {item.productName} x {item.quantity}
                      </Typography>
                      <Typography>₹{Number(item.totalPrice).toFixed(2)}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default OrdersPage;
