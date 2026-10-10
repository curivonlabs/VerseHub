import express from "express";
import morgan from "morgan";

import env from "./config/env.js";
import connectDB from "./config/db.js";
import authRoutes from "./routers/user.router.js";

const app = express();
const PORT = env.app.port || 3000;

app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use("/api/v1/users", authRoutes);

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

app.listen(PORT, () => {
  console.log(`Server Started on PORT: ${PORT}`);
  console.info(`Listening at http://localhost:${PORT}/`)
});