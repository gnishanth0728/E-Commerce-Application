const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 8085;

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3310),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "ecommerce_shipping",
};

let pool;

app.use(cors());
app.use(express.json());

const getLocationByCityAndPostalCode = async (city, postalCode) => {
  const [rows] = await pool.execute(
    "SELECT city, postal_code, distance_km FROM india_locations WHERE LOWER(city) = LOWER(?) AND postal_code = ? LIMIT 1",
    [city, postalCode]
  );

  return rows.length > 0 ? rows[0] : null;
};

const calculateShippingCost = (distanceKm) => {
  if (distanceKm < 10) {
    return 0;
  }
  if (distanceKm <= 50) {
    return 50;
  }
  if (distanceKm <= 200) {
    return 100;
  }
  return 250;
};

app.get("/health", (_req, res) => {
  res.json({ status: "UP", service: "shipping-service" });
});

app.post("/api/shipping/calculate", async (req, res) => {
  const {
    doorNumber,
    flatAddress,
    lane,
    city,
    postalCode
  } = req.body || {};

  if (!doorNumber || !flatAddress || !lane || !city || !postalCode) {
    return res.status(400).json({
      status: "FAILED",
      message: "Missing required address fields",
    });
  }

  if (!/^\d{6}$/.test(String(postalCode))) {
    return res.status(400).json({
      status: "FAILED",
      message: "postalCode must be a valid 6 digit Indian PIN code",
    });
  }

  try {
    const location = await getLocationByCityAndPostalCode(city.trim(), String(postalCode));

    if (!location) {
      return res.status(400).json({
        status: "FAILED",
        message: "Unsupported city/postal code. Please use a valid Indian location.",
      });
    }

    const numericDistance = Number(location.distance_km);
    const shippingCost = calculateShippingCost(numericDistance);

    return res.status(200).json({
      status: "SUCCESS",
      doorNumber,
      flatAddress,
      lane,
      city: location.city,
      postalCode: location.postal_code,
      distanceKm: numericDistance,
      shippingCost,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: "Unable to fetch shipping distance from location database",
    });
  }
});

app.get("/api/shipping/locations", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT city, postal_code AS postalCode FROM india_locations ORDER BY city, postal_code"
    );
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: "Unable to load locations" });
  }
});

const start = async () => {
  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
  });

  await pool.query("SELECT 1");

  app.listen(PORT, () => {
    console.log(`Shipping service running on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start shipping-service:", error.message);
  process.exit(1);
});
