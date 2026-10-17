import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";

export const savePoem = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
        status_code: 400,
      });
    }

    const postExists = await Post.exists({ _id: postId });

    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: "Poem not found",
        status_code: 404,
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { savedPoems: postId } },
      { new: true },
    ).select("_id");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Poem saved successfully",
      data: { postId },
      status_code: 200,
    });
  } catch (error) {
    console.error("Error in savePoem:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      status_code: 500,
    });
  }
};

export const unsavePoem = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
        status_code: 400,
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { savedPoems: postId } },
      { new: true },
    ).select("_id");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Poem removed from saved collection",
      data: { postId },
      status_code: 200,
    });
  } catch (error) {
    console.error("Error in unsavePoem:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      status_code: 500,
    });
  }
};

export const getSavedPoems = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("savedPoems")
      .populate({
        path: "savedPoems",
        select: "author title content createdAt likes",
        populate: {
          path: "author",
          select: "username name profilePic",
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    const savedPoems = user.savedPoems.filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        savedPoems,
        count: savedPoems.length,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error("Error in getSavedPoems:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      status_code: 500,
    });
  }
};
