import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "expense_tracker",
  password: "123456",
  port: 5432,
});

export default pool;