import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import pool from "./config/db.js";
import { config } from "./config/env.js";

const app = express();

// Render routes requests through a proxy; needed for correct client IPs.
app.set("trust proxy", 1);

app.use(
  helmet({
    // The API is consumed cross-origin by the Vercel frontend.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// General API limiter; health check path stays unthrottled for uptime probes.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
});

// Strict limiter against brute-force login/registration attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" },
});

app.use(apiLimiter);
app.use(cors(config.corsOrigins ? { origin: config.corsOrigins } : {}));
app.use(express.json({ limit: "16kb" }));
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);


app.get("/", (req, res) => {
  res.send("API Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    message: "API Working",
  });
});

pool.connect()
  .then(async () => {
    console.log("PostgreSQL Connected");
    app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });