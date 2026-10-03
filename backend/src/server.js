import express from "express";
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

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
  console.log(`Server Started on PORT: ${PORT}`)
});