
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      minLength: 5,
      maxLength: 50,
      lowercase: true,
      unique: true,
      index: true,
      required: true,
    },
    email: {
      type: String,
      minLength: 6,
      maxLength: 254,
      lowercase: true,
      trim: true,
      unique: true,
      required: true,
    },
    bio: {
      type: String,
      maxLength: 300,
    },
    profilePic: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    savedPoems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;