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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  getCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} from "../api/cartApi";
import { checkoutCart, getSavedCard } from "../api/orderApi";
import { getShippingLocations } from "../api/shippingApi";
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

interface PaymentForm {
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  doorNumber: string;
  flatAddress: string;
  lane: string;
  city: string;
  postalCode: string;
}

type CardType = "VISA" | "RUPAY" | "FOREX" | "UNKNOWN";

interface SavedCardData {
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
}

interface ShippingLocation {
  city: string;
  postalCode: string;
}

interface CheckoutSummary {
  orderId: string;
  itemsTotal: number;
  gstAmount: number;
  shippingCost: number;
  finalAmount: number;
}

const CartPage: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentForm>>({});
  const [saveCardForAccount, setSaveCardForAccount] = useState(false);
  const [shippingLocations, setShippingLocations] = useState<ShippingLocation[]>([]);
  const [shippingLocationsLoading, setShippingLocationsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState("");
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    cardHolderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    doorNumber: "",
    flatAddress: "",
    lane: "",
    city: "",
    postalCode: "",
  });
  const navigate = useNavigate();

  const normalizeCardNumber = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
    return digitsOnly.replace(/(.{4})/g, "$1 ").trim();
  };

  const detectCardType = (cardNumber: string): CardType => {
    const digitsOnly = cardNumber.replace(/\D/g, "");
    if (digitsOnly.length < 6) {
      return "UNKNOWN";
    }

    const bin = digitsOnly.slice(0, 6);

    if (/^4\d{5}$/.test(bin)) {
      return "VISA";
    }

    if (/^(60\d{4}|65\d{4}|81\d{4}|82\d{4}|508\d{3}|353\d{3}|356\d{3})$/.test(bin)) {
      return "RUPAY";
    }

    return "FOREX";
  };

  const currentCardType: CardType = detectCardType(paymentForm.cardNumber);

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
      const response = await checkoutCart({
        cardHolderName: paymentForm.cardHolderName,
        cardNumber: paymentForm.cardNumber,
        expiryDate: paymentForm.expiryDate,
        cvv: paymentForm.cvv,
        saveCard: saveCardForAccount,
        doorNumber: paymentForm.doorNumber,
        flatAddress: paymentForm.flatAddress,
        lane: paymentForm.lane,
        city: paymentForm.city,
        postalCode: paymentForm.postalCode,
      });
      const checkoutData = response.data;
      setCheckoutSummary({
        orderId: checkoutData.orderId,
        itemsTotal: Number(checkoutData.itemsTotal || 0),
        gstAmount: Number(checkoutData.gstAmount || 0),
        shippingCost: Number(checkoutData.shippingCost || 0),
        finalAmount: Number(checkoutData.finalAmount || checkoutData.totalPrice || 0),
      });
      await loadCart();
    } catch (err: any) {
      setCheckoutSummary(null);
      const responseData = err.response?.data;
      const backendMessage =
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === "string" ? responseData : null);
      const status = err.response?.status;

      setError(
        backendMessage ||
          (status ? `Checkout failed (HTTP ${status})` : "Checkout failed")
      );
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      cardHolderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      doorNumber: "",
      flatAddress: "",
      lane: "",
      city: "",
      postalCode: "",
    });
    setSaveCardForAccount(false);
    setPaymentErrors({});
  };

  const handleOpenCheckoutDialog = () => {
    setError(null);
    setCheckoutSummary(null);
    resetPaymentForm();
    void loadSavedCardFromDb();
    void loadShippingLocations();
    setCheckoutDialogOpen(true);
  };

  const loadShippingLocations = async () => {
    try {
      setShippingLocationsLoading(true);
      const response = await getShippingLocations();
      setShippingLocations(response.data || []);
    } catch {
      setShippingLocations([]);
    } finally {
      setShippingLocationsLoading(false);
    }
  };

  const loadSavedCardFromDb = async () => {
    try {
      const response = await getSavedCard();
      const savedCard: SavedCardData | null = response.data;

      if (!savedCard) {
        return;
      }

      setPaymentForm((previous: PaymentForm) => ({
        ...previous,
        cardHolderName: savedCard.cardHolderName,
        cardNumber: savedCard.cardNumber,
        expiryDate: savedCard.expiryDate,
      }));
      setSaveCardForAccount(true);
    } catch {
      // Keep checkout usable even if saved card fetch fails.
    }
  };

  const handleCloseCheckoutDialog = () => {
    setCheckoutDialogOpen(false);
    setPaymentErrors({});
    setCheckoutSummary(null);
  };

  const handlePlaceSelection = (value: string) => {
    setSelectedPlace(value);
    if (!value) {
      setPaymentForm({ ...paymentForm, city: "", postalCode: "" });
      return;
    }

    const [city, postalCode] = value.split("|");
    setPaymentForm({ ...paymentForm, city, postalCode });
  };

  const validatePaymentForm = () => {
    const errors: Partial<PaymentForm> = {};

    if (!paymentForm.cardHolderName.trim()) {
      errors.cardHolderName = "Card holder name is required";
    }

    const cleanedCardNumber = paymentForm.cardNumber.replace(/\s/g, "");
    if (!/^\d{16}$/.test(cleanedCardNumber)) {
      errors.cardNumber = "Card number must be 16 digits";
    } else if (detectCardType(cleanedCardNumber) === "UNKNOWN") {
      errors.cardNumber = "Enter at least the first 6 digits to detect card type";
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentForm.expiryDate)) {
      errors.expiryDate = "Expiry must be in MM/YY format";
    }

    if (!/^\d{3}$/.test(paymentForm.cvv)) {
      errors.cvv = "CVV must be 3 digits";
    }

    if (!paymentForm.doorNumber.trim()) {
      errors.doorNumber = "Door number is required";
    }

    if (!paymentForm.flatAddress.trim()) {
      errors.flatAddress = "Flat or street address is required";
    }

    if (!paymentForm.lane.trim()) {
      errors.lane = "Lane is required";
    }

    if (!paymentForm.city.trim()) {
      errors.city = "City is required";
    }

    if (!/^\d{6}$/.test(paymentForm.postalCode)) {
      errors.postalCode = "Postal code must be a valid 6 digit Indian PIN code";
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmCheckout = async () => {
    if (!validatePaymentForm()) {
      return;
    }

    await handleCheckout();
    resetPaymentForm();
  };

  const calculateTotalPrice = () => {
    return cart?.items?.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0) || 0;
  };

  const calculateTotalItems = () => {
    return cart?.items?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) || 0;
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

      {cart && cart.items && cart.items.length > 0 ? (
        <Grid container spacing={3}>
          {/* Cart Items */}
          <Grid size={{ xs: 12, md: 8 }}>
            {cart.items.map((item: CartItem) => (
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
                  <Typography>Item Bill ({calculateTotalItems()})</Typography>
                  <Typography>₹{calculateTotalPrice().toFixed(2)}</Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>GST + Shipping</Typography>
                  <Typography color="text.secondary">Calculated at checkout</Typography>
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
                  ₹{calculateTotalPrice().toFixed(2)}+
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleOpenCheckoutDialog}
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

      <Dialog
        open={checkoutDialogOpen}
        onClose={handleCloseCheckoutDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Checkout Details</DialogTitle>
        <DialogContent>
          {checkoutSummary ? (
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: "linear-gradient(135deg, #e8f5e9 0%, #f4fbf6 100%)",
                border: "1px solid #c8e6c9",
              }}
            >
              <Alert severity="success" sx={{ mb: 2 }}>
                Payment successful. Your order has been placed.
              </Alert>

              <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 1 }}>
                Order {checkoutSummary.orderId} confirmed
              </Typography>

              <Box sx={{ display: "grid", gap: 1, mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Items Total</Typography>
                  <Typography variant="body2">₹{checkoutSummary.itemsTotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">GST</Typography>
                  <Typography variant="body2">₹{checkoutSummary.gstAmount.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Shipping</Typography>
                  <Typography variant="body2">₹{checkoutSummary.shippingCost.toFixed(2)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700 }}>Final Bill</Typography>
                  <Typography sx={{ fontWeight: 800, color: "#1b5e20" }}>
                    ₹{checkoutSummary.finalAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ px: 1.5, py: 0.75, borderRadius: 999, bgcolor: "#d9f0de", color: "#1b5e20", fontWeight: 700 }}>
                  Payment Status: SUCCESS
                </Box>
                <Box sx={{ px: 1.5, py: 0.75, borderRadius: 999, bgcolor: "#dbeafe", color: "#0f4c81", fontWeight: 700 }}>
                  Order Status: CONFIRMED
                </Box>
              </Box>
            </Box>
          ) : (
            <>
              <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                Cart Summary
              </Typography>

              {cart?.items?.map((item: CartItem) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2">
                    {item.productName} x {item.quantity}
                  </Typography>
                  <Typography variant="body2">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                Payment Details
              </Typography>

              <TextField
                fullWidth
                label="Card Holder Name"
                value={paymentForm.cardHolderName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPaymentForm({ ...paymentForm, cardHolderName: e.target.value })
                }
                error={Boolean(paymentErrors.cardHolderName)}
                helperText={paymentErrors.cardHolderName}
                margin="dense"
              />

              <TextField
                fullWidth
                label="Card Number"
                value={paymentForm.cardNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPaymentForm({
                    ...paymentForm,
                    cardNumber: normalizeCardNumber(e.target.value),
                  })
                }
                error={Boolean(paymentErrors.cardNumber)}
                helperText={paymentErrors.cardNumber || "Enter 16-digit card number"}
                margin="dense"
                slotProps={{
                  htmlInput: { inputMode: "numeric", maxLength: 19 },
                }}
              />

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Card type (first 6 digits): {currentCardType === "UNKNOWN" ? "Enter first 6 digits" : currentCardType}
              </Typography>

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Expiry (MM/YY)"
                  value={paymentForm.expiryDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPaymentForm({ ...paymentForm, expiryDate: e.target.value })
                  }
                  error={Boolean(paymentErrors.expiryDate)}
                  helperText={paymentErrors.expiryDate}
                  margin="dense"
                />

                <TextField
                  fullWidth
                  label="CVV"
                  type="password"
                  value={paymentForm.cvv}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })
                  }
                  error={Boolean(paymentErrors.cvv)}
                  helperText={paymentErrors.cvv}
                  margin="dense"
                  slotProps={{
                    htmlInput: { inputMode: "numeric", maxLength: 3 },
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                Shipping Address
              </Typography>

              <TextField
                fullWidth
                label="Door Number"
                value={paymentForm.doorNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPaymentForm({ ...paymentForm, doorNumber: e.target.value })
                }
                error={Boolean(paymentErrors.doorNumber)}
                helperText={paymentErrors.doorNumber}
                margin="dense"
              />

              <TextField
                fullWidth
                label="Flat / Street Address"
                value={paymentForm.flatAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPaymentForm({ ...paymentForm, flatAddress: e.target.value })
                }
                error={Boolean(paymentErrors.flatAddress)}
                helperText={paymentErrors.flatAddress}
                margin="dense"
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Lane"
                  value={paymentForm.lane}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPaymentForm({ ...paymentForm, lane: e.target.value })
                  }
                  error={Boolean(paymentErrors.lane)}
                  helperText={paymentErrors.lane}
                  margin="dense"
                />

                <Autocomplete
                  fullWidth
                  options={shippingLocations.map(
                    (location: ShippingLocation) => `${location.city}|${location.postalCode}`
                  )}
                  value={selectedPlace || null}
                  onChange={(_event: any, value: string | null) => handlePlaceSelection(value || "")}
                  loading={shippingLocationsLoading}
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      label="Select Place (City - PIN)"
                      margin="dense"
                      helperText={
                        shippingLocationsLoading
                          ? "Loading places..."
                          : "Type to search city or PIN from India places database"
                      }
                    />
                  )}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>

                <TextField
                  fullWidth
                  label="City"
                  value={paymentForm.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPaymentForm({ ...paymentForm, city: e.target.value })
                  }
                  error={Boolean(paymentErrors.city)}
                  helperText={paymentErrors.city}
                  margin="dense"
                />

                <TextField
                  fullWidth
                  label="Postal Code"
                  value={paymentForm.postalCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPaymentForm({ ...paymentForm, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) })
                  }
                  error={Boolean(paymentErrors.postalCode)}
                  helperText={paymentErrors.postalCode}
                  margin="dense"
                  slotProps={{
                    htmlInput: { inputMode: "numeric", maxLength: 6 },
                  }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Shipping distance is auto-fetched from India location database using City + Postal Code.
              </Typography>

              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    checked={saveCardForAccount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSaveCardForAccount(e.target.checked)
                    }
                  />
                }
                label="Save this card in my account"
              />

              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                CVV is never saved.
              </Typography>

              <Typography sx={{ mt: 2, fontWeight: "bold" }}>
                Item Bill (before GST and shipping): ₹{calculateTotalPrice().toFixed(2)}
              </Typography>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {checkoutSummary ? (
            <Button onClick={handleCloseCheckoutDialog} variant="contained">
              Close
            </Button>
          ) : (
            <>
              <Button onClick={handleCloseCheckoutDialog} variant="outlined">
                Cancel
              </Button>
              <Button onClick={handleConfirmCheckout} variant="contained">
                Pay & Place Order
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CartPage;
