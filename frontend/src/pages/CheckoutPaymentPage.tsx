import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Divider,
  Fade,
  FormControlLabel,
  Grid,
  Paper,
  Step,
  StepButton,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { getCart } from "../api/cartApi";
import { checkoutCart, getSavedCard, previewOrder, type OrderPreviewResponse } from "../api/orderApi";
import { getShippingLocations } from "../api/shippingApi";

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
}

interface Cart {
  items: CartItem[];
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

interface ShippingLocation {
  city: string;
  postalCode: string;
}

interface SavedCardData {
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
}

interface CheckoutSummary {
  orderId: string;
  itemsTotal: number;
  gstAmount: number;
  shippingCost: number;
  finalAmount: number;
}

interface OrderCostPreview {
  totalItems: number;
  itemBill: number;
  gstAmount: number;
  shippingCost: number;
  finalAmount: number;
}

const emptyForm: PaymentForm = {
  cardHolderName: "",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  doorNumber: "",
  flatAddress: "",
  lane: "",
  city: "",
  postalCode: "",
};

const CheckoutPaymentPage: React.FC = () => {
  const steps = ["Shipping", "Payment", "Review", "Success"];
  const progressLabelByStep: Record<number, string> = {
    0: "Shipping Details",
    1: "Payment Method",
    2: "Final Review",
    3: "Order Complete",
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentForm>>({});
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [orderCostPreview, setOrderCostPreview] = useState<OrderCostPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(0);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(emptyForm);
  const [saveCardForAccount, setSaveCardForAccount] = useState(false);
  const [shippingLocations, setShippingLocations] = useState<ShippingLocation[]>([]);
  const [shippingLocationsLoading, setShippingLocationsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState("");

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      setCart(response.data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Please login to continue checkout");
        navigate("/login");
      } else {
        setError("Failed to load cart details");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCardFromDb = async () => {
    try {
      const response = await getSavedCard();
      const savedCard: SavedCardData | null = response.data;
      if (!savedCard) {
        return;
      }

      setPaymentForm((previous) => ({
        ...previous,
        cardHolderName: savedCard.cardHolderName,
        cardNumber: savedCard.cardNumber,
        expiryDate: savedCard.expiryDate,
      }));
      setSaveCardForAccount(true);
    } catch {
      // Keep checkout available even if saved card cannot be fetched.
    }
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

  useEffect(() => {
    void loadCart();
    void loadSavedCardFromDb();
    void loadShippingLocations();
  }, []);

  const itemBill = useMemo(
    () => cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0,
    [cart]
  );

  const totalItems = useMemo(
    () => cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    [cart]
  );

  const normalizeCardNumber = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
    return digitsOnly.replace(/(.{4})/g, "$1 ").trim();
  };

  const validateShippingForm = () => {
    const errors: Partial<PaymentForm> = {};

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
      errors.postalCode = "Postal code must be 6 digits";
    }

    setPaymentErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validatePaymentForm = () => {
    const errors: Partial<PaymentForm> = {};

    if (!paymentForm.cardHolderName.trim()) {
      errors.cardHolderName = "Card holder name is required";
    }

    if (!/^\d{16}$/.test(paymentForm.cardNumber.replace(/\s/g, ""))) {
      errors.cardNumber = "Card number must be 16 digits";
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentForm.expiryDate)) {
      errors.expiryDate = "Expiry must be in MM/YY format";
    }

    if (!/^\d{3}$/.test(paymentForm.cvv)) {
      errors.cvv = "CVV must be 3 digits";
    }

    setPaymentErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const clearStepErrors = (fields: Array<keyof PaymentForm>) => {
    setPaymentErrors((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        delete next[field];
      });
      return next;
    });
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

  const handleConfirmPayment = async () => {
    if (!validateShippingForm() || !validatePaymentForm()) {
      return;
    }

    try {
      setProcessing(true);
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
      setSummary({
        orderId: checkoutData.orderId,
        itemsTotal: Number(checkoutData.itemsTotal || 0),
        gstAmount: Number(checkoutData.gstAmount || 0),
        shippingCost: Number(checkoutData.shippingCost || 0),
        finalAmount: Number(checkoutData.finalAmount || checkoutData.totalPrice || 0),
      });
      setActiveStep(3);
      setMaxUnlockedStep(3);
      setPaymentForm(emptyForm);
      setPaymentErrors({});
    } catch (err: any) {
      const responseData = err.response?.data;
      const backendMessage =
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === "string" ? responseData : null);
      setError(backendMessage || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const loadOrderCostPreview = async (): Promise<boolean> => {
    try {
      setPreviewLoading(true);
      setError(null);
      const response = await previewOrder({
        doorNumber: paymentForm.doorNumber,
        flatAddress: paymentForm.flatAddress,
        lane: paymentForm.lane,
        city: paymentForm.city,
        postalCode: paymentForm.postalCode,
      });
      const preview: OrderPreviewResponse = response.data;
      setOrderCostPreview({
        totalItems: Number(preview.totalItems || 0),
        itemBill: Number(preview.itemBill || 0),
        gstAmount: Number(preview.gstAmount || 0),
        shippingCost: Number(preview.shippingCost || 0),
        finalAmount: Number(preview.finalAmount || 0),
      });
      return true;
    } catch (err: any) {
      const responseData = err.response?.data;
      const backendMessage =
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === "string" ? responseData : null);
      setError(backendMessage || "Unable to calculate GST and shipping for review.");
      return false;
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5">Loading checkout...</Typography>
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
          background: "linear-gradient(135deg, #0f766e 0%, #0ea5a4 45%, #67e8f9 100%)",
          color: "white",
          boxShadow: "0 18px 40px rgba(15, 118, 110, 0.25)",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Payment & Shipping
        </Typography>
        <Typography sx={{ opacity: 0.92 }}>
          Complete checkout in simple steps and review final bill after payment success.
        </Typography>
      </Box>

      <Paper
        sx={{
          p: { xs: 1.25, md: 2 },
          mb: 3,
          borderRadius: 3,
          border: "1px solid #d8ecea",
          bgcolor: "#f4fbfa",
        }}
      >
        <Stepper
          activeStep={activeStep}
          alternativeLabel={!isMobile}
          orientation={isMobile ? "vertical" : "horizontal"}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                <StepButton
                  color="inherit"
                  onClick={() => {
                    if (index <= maxUnlockedStep) {
                      setActiveStep(index);
                    }
                  }}
                  disabled={index > maxUnlockedStep}
                >
                  {label}
                </StepButton>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {summary ? (
        <Fade in timeout={400}>
          <Card sx={{ borderRadius: 4, border: "1px solid #c8e6c9", background: "linear-gradient(135deg, #e8f5e9 0%, #f4fbf6 100%)" }}>
          <CardContent sx={{ p: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Payment successful. Order placed successfully.
            </Alert>
            <Typography sx={{ fontSize: 20, fontWeight: 800, mb: 2 }}>
              Order {summary.orderId} confirmed
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>Final Bill</Typography>
                  <Box sx={{ display: "grid", gap: 0.8 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">Item Bill</Typography>
                      <Typography variant="body2">₹{summary.itemsTotal.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">GST</Typography>
                      <Typography variant="body2">₹{summary.gstAmount.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">Shipping</Typography>
                      <Typography variant="body2">₹{summary.shippingCost.toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography sx={{ fontWeight: 700 }}>Total Paid</Typography>
                      <Typography sx={{ fontWeight: 800, color: "#1b5e20" }}>
                        ₹{summary.finalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>Status</Typography>
                  <Box sx={{ display: "grid", gap: 1 }}>
                    <Box sx={{ px: 1.5, py: 0.75, borderRadius: 999, bgcolor: "#d9f0de", color: "#1b5e20", fontWeight: 700, width: "fit-content" }}>
                      Payment: SUCCESS
                    </Box>
                    <Box sx={{ px: 1.5, py: 0.75, borderRadius: 999, bgcolor: "#dbeafe", color: "#0f4c81", fontWeight: 700, width: "fit-content" }}>
                      Order: CONFIRMED
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button variant="contained" onClick={() => navigate("/orders")}>View Orders</Button>
              <Button variant="outlined" onClick={() => navigate("/")}>Continue Shopping</Button>
            </Box>
          </CardContent>
          </Card>
        </Fade>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 2, md: 1 } }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e5eefc" }}>
              {activeStep === 0 && (
                <Fade in timeout={300}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Shipping Address</Typography>

                    <TextField
                      fullWidth
                      label="Door Number"
                      value={paymentForm.doorNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setPaymentForm({ ...paymentForm, doorNumber: e.target.value });
                        clearStepErrors(["doorNumber"]);
                      }}
                      error={Boolean(paymentErrors.doorNumber)}
                      helperText={paymentErrors.doorNumber}
                      margin="dense"
                    />

                    <TextField
                      fullWidth
                      label="Flat / Street Address"
                      value={paymentForm.flatAddress}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setPaymentForm({ ...paymentForm, flatAddress: e.target.value });
                        clearStepErrors(["flatAddress"]);
                      }}
                      error={Boolean(paymentErrors.flatAddress)}
                      helperText={paymentErrors.flatAddress}
                      margin="dense"
                    />

                    <Box sx={{ display: "flex", gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Lane"
                        value={paymentForm.lane}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setPaymentForm({ ...paymentForm, lane: e.target.value });
                          clearStepErrors(["lane"]);
                        }}
                        error={Boolean(paymentErrors.lane)}
                        helperText={paymentErrors.lane}
                        margin="dense"
                      />

                      <Autocomplete
                        fullWidth
                        options={shippingLocations.map((location) => `${location.city}|${location.postalCode}`)}
                        value={selectedPlace || null}
                        onChange={(_event, value) => handlePlaceSelection(value || "")}
                        loading={shippingLocationsLoading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Place (City - PIN)"
                            margin="dense"
                            helperText={
                              shippingLocationsLoading
                                ? "Loading places..."
                                : "Search city or PIN from India place database"
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setPaymentForm({ ...paymentForm, city: e.target.value });
                          clearStepErrors(["city"]);
                        }}
                        error={Boolean(paymentErrors.city)}
                        helperText={paymentErrors.city}
                        margin="dense"
                      />

                      <TextField
                        fullWidth
                        label="Postal Code"
                        value={paymentForm.postalCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setPaymentForm({ ...paymentForm, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) });
                          clearStepErrors(["postalCode"]);
                        }}
                        error={Boolean(paymentErrors.postalCode)}
                        helperText={paymentErrors.postalCode}
                        margin="dense"
                        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
                      />
                    </Box>
                  </Box>
                </Fade>
              )}

              {activeStep === 1 && (
                <Fade in timeout={300}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Payment Details</Typography>

                    <TextField
                      fullWidth
                      label="Card Holder Name"
                      value={paymentForm.cardHolderName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setPaymentForm({ ...paymentForm, cardHolderName: e.target.value });
                        clearStepErrors(["cardHolderName"]);
                      }}
                      error={Boolean(paymentErrors.cardHolderName)}
                      helperText={paymentErrors.cardHolderName}
                      margin="dense"
                    />

                    <TextField
                      fullWidth
                      label="Card Number"
                      value={paymentForm.cardNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setPaymentForm({ ...paymentForm, cardNumber: normalizeCardNumber(e.target.value) });
                        clearStepErrors(["cardNumber"]);
                      }}
                      error={Boolean(paymentErrors.cardNumber)}
                      helperText={paymentErrors.cardNumber || "Enter 16-digit card number"}
                      margin="dense"
                      slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 19 } }}
                    />

                    <Box sx={{ display: "flex", gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Expiry (MM/YY)"
                        value={paymentForm.expiryDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setPaymentForm({ ...paymentForm, expiryDate: e.target.value });
                          clearStepErrors(["expiryDate"]);
                        }}
                        error={Boolean(paymentErrors.expiryDate)}
                        helperText={paymentErrors.expiryDate}
                        margin="dense"
                      />

                      <TextField
                        fullWidth
                        label="CVV"
                        type="password"
                        value={paymentForm.cvv}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) });
                          clearStepErrors(["cvv"]);
                        }}
                        error={Boolean(paymentErrors.cvv)}
                        helperText={paymentErrors.cvv}
                        margin="dense"
                        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 3 } }}
                      />
                    </Box>

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
                  </Box>
                </Fade>
              )}

              {activeStep === 2 && (
                <Fade in timeout={300}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Review Details</Typography>
                    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fbff", mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>Shipping To</Typography>
                      <Typography variant="body2">
                        {paymentForm.doorNumber}, {paymentForm.flatAddress}, {paymentForm.lane}
                      </Typography>
                      <Typography variant="body2">
                        {paymentForm.city} - {paymentForm.postalCode}
                      </Typography>
                    </Paper>

                    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#fff7ed", mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>Payment Method</Typography>
                      <Typography variant="body2">
                        Card ending {paymentForm.cardNumber.replace(/\s/g, "").slice(-4)}
                      </Typography>
                      <Typography variant="body2">Holder: {paymentForm.cardHolderName}</Typography>
                    </Paper>

                    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#eef6ff", mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>Charges Preview</Typography>
                      <Box sx={{ display: "grid", gap: 0.6 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2">Item Bill</Typography>
                          <Typography variant="body2">₹{(orderCostPreview?.itemBill ?? itemBill).toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2">GST</Typography>
                          <Typography variant="body2">₹{(orderCostPreview?.gstAmount ?? 0).toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2">Shipping</Typography>
                          <Typography variant="body2">₹{(orderCostPreview?.shippingCost ?? 0).toFixed(2)}</Typography>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography sx={{ fontWeight: 700 }}>Estimated Final</Typography>
                          <Typography sx={{ fontWeight: 800 }}>₹{(orderCostPreview?.finalAmount ?? itemBill).toFixed(2)}</Typography>
                        </Box>
                      </Box>
                    </Paper>

                    <Typography variant="body2" color="text.secondary">
                      By placing this order, you confirm shipping details and authorize payment.
                    </Typography>
                  </Box>
                </Fade>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }} sx={{ order: { xs: 1, md: 2 } }}>
            <Paper
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                position: { xs: "static", md: "sticky" },
                top: { md: 20 },
                border: "1px solid #e5eefc",
                boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Order Summary</Typography>

              <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: "#f8fbff" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>Item Bill ({totalItems})</Typography>
                  <Typography sx={{ fontWeight: 800 }}>₹{itemBill.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>GST</Typography>
                  <Typography color="text.secondary">
                    {orderCostPreview ? `₹${orderCostPreview.gstAmount.toFixed(2)}` : "Calculated at checkout"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
                  <Typography>Shipping</Typography>
                  <Typography color="text.secondary">
                    {orderCostPreview ? `₹${orderCostPreview.shippingCost.toFixed(2)}` : "Calculated at checkout"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Estimated Final</Typography>
                <Typography sx={{ fontWeight: 800, color: "#0f4c81" }}>
                  ₹{(orderCostPreview?.finalAmount ?? itemBill).toFixed(2)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ mb: 1, fontWeight: 700 }}>Cart Items</Typography>
              <Box sx={{ maxHeight: 220, overflow: "auto", mb: 2 }}>
                {(cart?.items || []).map((item) => (
                  <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                    <Typography variant="body2">{item.productName} x {item.quantity}</Typography>
                    <Typography variant="body2">₹{(item.price * item.quantity).toFixed(2)}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ mb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  color="primary"
                  variant="filled"
                  label={`Step ${Math.min(activeStep + 1, 4)} of 4`}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {progressLabelByStep[activeStep]}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                disabled={processing || previewLoading || (cart?.items?.length || 0) === 0}
                onClick={async () => {
                  if (activeStep === 0) {
                    if (validateShippingForm()) {
                      setActiveStep(1);
                      setMaxUnlockedStep((prev) => Math.max(prev, 1));
                    }
                    return;
                  }

                  if (activeStep === 1) {
                    if (validatePaymentForm()) {
                      const loaded = await loadOrderCostPreview();
                      if (loaded) {
                        setActiveStep(2);
                        setMaxUnlockedStep((prev) => Math.max(prev, 2));
                      }
                    }
                    return;
                  }

                  await handleConfirmPayment();
                }}
              >
                {previewLoading
                  ? "Calculating Charges..."
                  : processing
                  ? "Processing..."
                  : activeStep === 0
                    ? "Continue to Payment"
                    : activeStep === 1
                      ? "Review Order"
                      : "Pay & Place Order"}
              </Button>

              {activeStep > 0 ? (
                <Button fullWidth sx={{ mt: 1 }} onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}>
                  Back
                </Button>
              ) : (
                <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate("/cart")}>
                  Back to Cart
                </Button>
              )}

              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip size="small" label="Secure Checkout" color="success" variant="outlined" />
                <Chip size="small" label="Saved Card Supported" color="info" variant="outlined" />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default CheckoutPaymentPage;
