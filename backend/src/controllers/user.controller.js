import bcrypt from "bcryptjs";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const createAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing Field!",
        status_code: 400,
      });
    }

    const existingAccount = await User.findOne({ email });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "User Already Exists",
        status_code: 400,
      });
    }

    const username = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const usernameExists = await User.findOne({ username });

    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: "Username Already Exists",
        status_code: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    const token = generateToken({
      userId: user._id.toString()
    });

    return res.status(201).json({
      success: true,
      message: "Account Created Successfully",
      status_code: 201,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Error in createAccount (user.controller.js):", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      status_code: 500,
    });
  }
};