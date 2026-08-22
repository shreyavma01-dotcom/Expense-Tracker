import "dotenv/config";
import express from "express";
import cors from "cors";

import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import pool from "./config/db.js";
import { config } from "./config/env.js";

const app = express();

app.use(cors(config.corsOrigins ? { origin: config.corsOrigins } : {}));
app.use(express.json());
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
    console.log(err);
  });