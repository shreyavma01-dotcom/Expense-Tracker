import crypto from "node:crypto";

const isProduction = process.env.NODE_ENV === "production";

const requiredInProduction = (name) => {
  if (isProduction) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
      "Refusing to start in production without it."
    );
  }
};

// JWT signing secret. Required in production; development falls back to a
// random per-process secret so tokens never outlive the dev server.
let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  requiredInProduction("JWT_SECRET");
  jwtSecret = crypto.randomBytes(48).toString("hex");
  console.warn(
    "WARNING: JWT_SECRET is not set. Using a temporary per-process secret " +
    "(sessions reset on restart). Set JWT_SECRET for persistent sessions."
  );
}

// Comma-separated list of allowed browser origins. Unrestricted CORS is not
// acceptable in production.
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
  : undefined;

if (!corsOrigins || corsOrigins.length === 0) {
  requiredInProduction("CORS_ORIGIN");
  console.warn(
    "WARNING: CORS_ORIGIN is not set. All origins are allowed " +
    "(development only). Set CORS_ORIGIN to your frontend origin(s)."
  );
}

export const config = {
  jwtSecret,
  corsOrigins,
  port: Number(process.env.PORT) || 5001,
};
