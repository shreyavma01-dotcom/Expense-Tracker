import "dotenv/config";
import bcrypt from "bcrypt";
import pool from "../config/db.js";

// Development/demo credentials. Change or remove before production use.
// Passwords can be overridden with DEMO_ADMIN_PASSWORD / DEMO_USER_PASSWORD.
const DEMO_USERS = [
  {
    name: "Admin Demo",
    email: "admin@example.com",
    password: process.env.DEMO_ADMIN_PASSWORD || "ChangeMe123!",
  },
  {
    name: "Demo User",
    email: "user@example.com",
    password: process.env.DEMO_USER_PASSWORD || "ChangeMe123!",
  },
];

const seedDemoUsers = async () => {
  for (const { name, email, password } of DEMO_USERS) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          password = EXCLUDED.password
      RETURNING id, name, email, (xmax = 0) AS inserted
      `,
      [name, email, hashedPassword]
    );

    const user = result.rows[0];
    console.log(
      `${user.inserted ? "Created" : "Updated"} demo user: ${user.email} (${user.name})`
    );
  }
};

seedDemoUsers()
  .then(() => {
    console.log("Seed complete");
    return pool.end();
  })
  .catch((err) => {
    console.error("Seed failed:", err.message);
    pool.end().finally(() => process.exit(1));
  });
