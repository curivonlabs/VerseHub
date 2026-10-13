
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        status_code: 401,
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
        status_code: 401,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      !decoded ||
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      !/^[a-f\d]{24}$/i.test(decoded.userId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
        status_code: 401,
      });
    }

    const user = await User.findById(decoded.userId)
      .select("_id role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists",
        status_code: 401,
      });
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
        status_code: 401,
      });
    }

    console.error("Error in protect middleware:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      status_code: 500,
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Administrator access required",
      status_code: 403,
    });
  }

  next();
};
