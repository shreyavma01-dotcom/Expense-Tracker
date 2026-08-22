import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pool from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const migrate = async () => {
  const schemaPath = path.join(__dirname, "..", "..", "db", "schema.sql");
  const schema = await readFile(schemaPath, "utf8");
  await pool.query(schema);
  console.log("Migration complete (schema.sql applied)");
};

migrate()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Migration failed:", err.message);
    pool.end().finally(() => process.exit(1));
  });
