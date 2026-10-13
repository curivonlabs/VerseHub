import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
        status_code: 400,
      });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
        status_code: 400,
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Comment must not exceed 2000 characters",
        status_code: 400,
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

    const comment = await Comment.create({
      postId,
      author: req.user.userId,
      content: content.trim(),
    });

    await Post.findByIdAndUpdate(postId, {
      $addToSet: { comments: comment._id },
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name username profilePic"
    );

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      status_code: 201,
      comment: populatedComment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create comment",
      status_code: 500,
    });
  }
};

export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
        status_code: 400,
      });
    }

    const post = await Post.findById(postId).select("_id");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        status_code: 404,
      });
    }

    const comments = await Comment.find({ postId })
      .populate("author", "name username profilePic")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Comments retrieved successfully",
      status_code: 200,
      count: comments.length,
      comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve comments",
      status_code: 500,
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
        status_code: 400,
      });
    }

    if (
      typeof content !== "string" ||
      !content.trim() ||
      content.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Comment content must contain 1 to 2000 characters",
        status_code: 400,
      });
    }

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, author: req.user.userId },
      { $set: { content: content.trim() } },
      { new: true, runValidators: true }
    ).populate("author", "name username profilePic");

    if (!comment) {
      const exists = await Comment.exists({ _id: commentId });

      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not authorized to update this comment"
          : "Comment not found",
        status_code: exists ? 403 : 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      status_code: 200,
      comment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update comment",
      status_code: 500,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
        status_code: 400,
      });
    }

    const comment = await Comment.findOneAndDelete({
      _id: commentId,
      author: req.user.userId,
    });

    if (!comment) {
      const exists = await Comment.exists({ _id: commentId });

      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not authorized to delete this comment"
          : "Comment not found",
        status_code: exists ? 403 : 404,
      });
    }

    await Post.findByIdAndUpdate(comment.postId, {
      $pull: { comments: comment._id },
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      status_code: 200,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      status_code: 500,
    });
  }
};