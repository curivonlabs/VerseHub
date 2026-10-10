
import mongoose from "mongoose";
import User from "../models/User.js";

export const followUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { id: targetUserId } = req.params;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        status_code: 400,
      });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
        status_code: 400,
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    const [updatedCurrentUser] = await Promise.all([
      User.findByIdAndUpdate(
        currentUserId,
        { $addToSet: { following: targetUserId } },
        { new: true }
      ),
      User.findByIdAndUpdate(
        targetUserId,
        { $addToSet: { followers: currentUserId } }
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: "User followed successfully",
      status_code: 200,
      following: updatedCurrentUser.following.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to follow user",
      error: error.message,
      status_code: 500,
    });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { id: targetUserId } = req.params;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        status_code: 400,
      });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot unfollow yourself",
        status_code: 400,
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    const [updatedCurrentUser] = await Promise.all([
      User.findByIdAndUpdate(
        currentUserId,
        { $pull: { following: targetUserId } },
        { new: true }
      ),
      User.findByIdAndUpdate(
        targetUserId,
        { $pull: { followers: currentUserId } }
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
      status_code: 200,
      following: updatedCurrentUser.following.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to unfollow user",
      error: error.message,
      status_code: 500,
    });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        status_code: 400,
      });
    }

    const user = await User.findById(id)
      .select("followers")
      .populate("followers", "name username profilePic bio");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Followers retrieved successfully",
      status_code: 200,
      count: user.followers.length,
      followers: user.followers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve followers",
      error: error.message,
      status_code: 500,
    });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        status_code: 400,
      });
    }

    const user = await User.findById(id)
      .select("following")
      .populate("following", "name username profilePic bio");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Following retrieved successfully",
      status_code: 200,
      count: user.following.length,
      following: user.following,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve following",
      error: error.message,
      status_code: 500,
    });
  }
};
