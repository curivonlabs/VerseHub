
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPublicUser = (user) => ({
  id: user._id,
  username: user.username,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const isValidObjectId = (id) =>
  typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

export const createAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
        status_code: 400,
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters",
        status_code: 400,
      });
    }

    if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
        status_code: 400,
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and no more than 72 bytes",
        status_code: 400,
      });
    }

    const username = normalizedName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "A valid username could not be generated",
        status_code: 400,
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username },
      ],
    }).select("_id email username");

    if (existingUser) {
      const duplicateField =
        existingUser.email === normalizedEmail
          ? "Email"
          : "Username";

      return res.status(409).json({
        success: false,
        message: `${duplicateField} already exists`,
        status_code: 409,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: normalizedName,
      username,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken({
      userId: user._id.toString(),
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      status_code: 201,
      data: {
        user: getPublicUser(user),
        token,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or username already exists",
        status_code: 409,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid account details",
        status_code: 400,
      });
    }

    console.error("Error in createAccount:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      status_code: 500,
    });
  }
};

export const loginAccount = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        status_code: 400,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail.length > 254 ||
      !emailPattern.test(normalizedEmail) ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password format",
        status_code: 400,
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        status_code: 401,
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        status_code: 401,
      });
    }

    const token = generateToken({
      userId: user._id.toString(),
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      status_code: 200,
      data: {
        user: getPublicUser(user),
        token,
      },
    });
  } catch (error) {
    console.error("Error in loginAccount:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      status_code: 500,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      status_code: 200,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      status_code: 500,
    });
  }
};

export const getOneUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        status_code: 400,
      });
    }

    const requestingUserId = req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (requestingUserId !== id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this user",
        status_code: 403,
      });
    }

    const user = await User.findById(id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      status_code: 200,
      data: user,
    });
  } catch (error) {
    console.error("Error in getOneUser:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      status_code: 500,
    });
  }
};


export const updateAccount = async (req, res) => {
  try {
    const { name, username, email } = req.body ?? {};
    const updates = {};

    if (
      name === undefined &&
      username === undefined &&
      email === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
        status_code: 400,
      });
    }

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 80
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 80 characters",
          status_code: 400,
        });
      }

      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
          status_code: 400,
        });
      }

      updates.email = email.trim().toLowerCase();
    }

    if (username !== undefined) {
      if (
        typeof username !== "string" ||
        !/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Username must be 3–30 characters and contain only letters, numbers, or underscores",
          status_code: 400,
        });
      }

      updates.username = username.trim().toLowerCase();
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    for (const field of ["email", "username"]) {
      if (updates[field] !== undefined) {
        const existingUser = await User.findOne({
          [field]: updates[field],
          _id: { $ne: user._id },
        }).select("_id");

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: `${field === "email" ? "Email" : "Username"} already exists`,
            status_code: 409,
          });
        }
      }
    }

    Object.assign(user, updates);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account updated successfully",
      status_code: 200,
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or username already exists",
        status_code: 409,
      });
    }

    console.error("Error in updateAccount:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      status_code: 500,
    });
  }
};


export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body ?? {};

    if (typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
        status_code: 400,
      });
    }

    const user = await User.findById(req.user.userId)
      .select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
        status_code: 401,
      });
    }

    await User.deleteOne({ _id: user._id });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
      status_code: 200,
    });
  } catch (error) {
    console.error("Error in deleteAccount:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      status_code: 500,
    });
  }
};
