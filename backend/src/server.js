import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import mongoSanitize from "@exortek/express-mongo-sanitize";

import env from "./config/env.js";
import connectDB from "./config/database.js";
import authRoutes from "./routers/user.router.js";
import postRoutes from "./routers/post.router.js";
import adminRoutes from "./routers/admin.router.js";

const app = express();
const PORT = env.app.port || 3000;

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(helmet());
app.use(compression());

app.use(cors())
app.use(mongoSanitize());
/*
app.use(cors({
  origin: env.security.corsOrigins || "*", 
  credentials: true,
}));
*/

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
    status_code: 429,
  },
});
app.use("/api/", limiter);

app.use(morgan("dev"));

app.use("/api/v1/users", authRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/admin", adminRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to VerseHub Server!",
    status_code: 200,
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Everything is okay!",
    status_code: 200,
  });
});

app.use((_req, res, _next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    status_code: 404,
  });
});

app.use((err, _req, res, _next) => {
  console.error("Global Error Caught: ", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    status_code: err.status || 500,
  });
});

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`\nServer Started on PORT: ${PORT}`);
      console.info(`Listening at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error("Failed to start server due to database connection error:", error);
    process.exit(1);
  }
};

startServer();