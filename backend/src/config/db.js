import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const useSsl =
  process.env.PGSSL === "require" ||
  /sslmode=require/.test(process.env.DATABASE_URL || "");

if (
  process.env.NODE_ENV === "production" &&
  !process.env.DATABASE_URL &&
  !process.env.PGPASSWORD
) {
  throw new Error(
    "Missing database configuration. Set DATABASE_URL (or PG credentials) in production."
  );
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      }
    : {
        user: process.env.PGUSER || "postgres",
        host: process.env.PGHOST || "localhost",
        database: process.env.PGDATABASE || "expense_tracker",
        password: process.env.PGPASSWORD || "123456",
        port: Number(process.env.PGPORT) || 5432,
      }
);

export default pool;