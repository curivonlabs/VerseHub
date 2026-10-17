import mongoose from "mongoose";
import Post from "../models/Post.js";

export const togglePostLike = async (req, res) => {
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

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication",
        status_code: 401,
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        status_code: 404,
      });
    }

    const alreadyLiked = post.likes.some(
      (like) => like.toString() === userId.toString(),
    );

    const update = alreadyLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: postId,
        ...(alreadyLiked ? { likes: userId } : { likes: { $ne: userId } }),
      },
      update,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedPost) {
      return res.status(409).json({
        success: false,
        message: "The post's like status changed. Please try again.",
        status_code: 409,
      });
    }

    return res.status(200).json({
      success: true,
      message: alreadyLiked
        ? "Post unliked successfully"
        : "Post liked successfully",
      data: {
        postId: updatedPost._id,
        liked: !alreadyLiked,
        likesCount: updatedPost.likes.length,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error("Error in togglePostLike:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      status_code: 500,
    });
  }
};
