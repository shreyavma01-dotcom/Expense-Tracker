import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env.js";


// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userUUID = uuidv4();

    const result = await pool.query(
      `
      INSERT INTO users
      (uuid, name, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, uuid, name, email
      `,
      [userUUID, name, email, hashedPassword]
    );

    res.status(201).json({
      message: "User registered",
      user: result.rows[0],
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Registration failed",
    });
  }
};


// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        uuid: user.uuid,
      },
      config.jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    await pool.query(
      `
      INSERT INTO sessions
      (user_id, token)
      VALUES ($1, $2)
      `,
      [user.id, token]
    );

    res.json({
      message: "Login success",
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Login failed",
    });
  }
};


// LOGOUT
export const logoutUser = async (req, res) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1];

    await pool.query(
      `
      DELETE FROM sessions
      WHERE token=$1
      `,
      [token]
    );

    res.json({
      message: "Logged out",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Logout failed",
    });
  }
};