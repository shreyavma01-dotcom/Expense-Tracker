import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const authMiddleware = async (
  req,
  res,
  next
) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );

    // check session exists
    const session = await pool.query(
      `
      SELECT * FROM sessions
      WHERE token=$1
      `,
      [token]
    );

    if (session.rows.length === 0) {
      return res.status(401).json({
        message: "Session expired",
      });
    }

    req.user = decoded;

    next();
  } catch (err) {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};