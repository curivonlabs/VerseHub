import dotenv from "dotenv";
import * as z from "zod";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ quiet: true });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(5000),

  HOST: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .default("127.0.0.1"),

  DB_URI: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine(
      value =>
        value.startsWith("mongodb://") ||
        value.startsWith("mongodb+srv://"),
      {
        message: "MONGODB_URI must be a valid MongoDB connection string"
      }
    ),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters")
    .max(512),

  JWT_EXPIRES_IN: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .default("15m"),

  COOKIE_SECRET: z
    .string()
    .min(32, "COOKIE_SECRET must contain at least 32 characters")
    .max(512),

  CORS_ORIGIN: z
    .string()
    .trim()
    .min(1)
    .max(2048),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = result.error.issues.map(issue => ({
    variable: issue.path.join(".") || "environment",
    message: issue.message
  }));

  console.error("Invalid environment configuration:", errors);
  process.exit(1);
}

const values = result.data;

const corsOrigins = values.CORS_ORIGIN
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const env = Object.freeze({
  app: Object.freeze({
    nodeEnv: values.NODE_ENV,
    port: values.PORT,
    host: values.HOST,
    logLevel: values.LOG_LEVEL,
    trustProxy: values.TRUST_PROXY === "true"
  }),

  database: Object.freeze({
    dbURL: values.MONGODB_URI
  }),

  auth: Object.freeze({
    jwtSecret: values.JWT_SECRET,
    jwtExpiresIn: values.JWT_EXPIRES_IN,
    cookieSecret: values.COOKIE_SECRET
  }),

  security: Object.freeze({
    corsOrigins
  })
});

export default env;