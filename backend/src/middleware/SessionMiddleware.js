import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { config } from "../config/env.js";

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

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    // check session exists and has not expired
    const session = await pool.query(
      `
      SELECT * FROM sessions
      WHERE token=$1
        AND (expires_at IS NULL OR expires_at > NOW())
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