const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8083;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "UP", service: "payment-service" });
});

app.post("/api/payments/process", (req, res) => {
  const { orderId, userEmail, amount, totalItems } = req.body || {};

  if (!orderId || !userEmail || !amount || !totalItems) {
    return res.status(400).json({
      status: "FAILED",
      message: "Missing required payment fields"
    });
  }

  // Demo payment flow: approve positive amount payments.
  if (Number(amount) <= 0) {
    return res.status(400).json({
      status: "FAILED",
      message: "Invalid payment amount"
    });
  }

  const transactionId = `TXN-${Date.now()}`;

  return res.status(200).json({
    status: "SUCCESS",
    message: "Payment processed successfully",
    transactionId,
    orderId,
    paidAmount: Number(amount),
    paidAt: Date.now()
  });
});

app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});
