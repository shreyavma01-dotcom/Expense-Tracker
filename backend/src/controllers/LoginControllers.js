import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const foundUser = user.rows[0];

    // password check here

    const token = jwt.sign(
      {
        id: foundUser.id,
        email: foundUser.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // STORE SESSION IN DATABASE
    await pool.query(
      `
      INSERT INTO sessions
      (user_id, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '7 days')
      `,
      [foundUser.id, token]
    );

    res.json({
      token,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};