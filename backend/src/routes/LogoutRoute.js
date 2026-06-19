import pool from "../config/db.js";

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
    res.status(500).json({
      message: "Logout failed",
    });
  }
};