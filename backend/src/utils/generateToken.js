import jwt from "jsonwebtoken";
import env from "../config/env.js";

const generateToken = payload => {
  if (!payload || typeof payload !== "object") {
    throw new TypeError("Token payload must be an object");
  }

  return jwt.sign(payload, env.auth.jwtSecret, {
    expiresIn: env.auth.jwtExpiresIn,
    algorithm: "HS256"
  });
};

export default generateToken;