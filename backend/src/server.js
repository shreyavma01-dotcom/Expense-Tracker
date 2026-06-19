import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import pool from "./config/db.js";

const app = express();


app.use(cors());
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

const seedDemoUser = async () => {
  try {
    const existing = await pool.query("SELECT * FROM users WHERE email=$1", ["admin@gmail.com"]);
    if (existing.rows.length === 0) {
      const hashedPassword = await bcrypt.hash("123456", 10);
      await pool.query(
        "INSERT INTO users (uuid, name, email, password) VALUES ($1, $2, $3, $4)",
        [uuidv4(), "Admin", "admin@gmail.com", hashedPassword]
      );
      console.log("Demo user created: admin@gmail.com / 123456");
    }
  } catch (err) {
    console.log("Seed error:", err.message);
  }
};

const PORT = 5001;

pool.connect()
  .then(async () => {
    console.log("PostgreSQL Connected");
    await seedDemoUser();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });