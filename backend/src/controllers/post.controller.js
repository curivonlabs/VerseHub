import mongoose from "mongoose";
import Post from "../models/Post.js";

export const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
        status_code: 400,
      });
    }

    if (title.trim().length > 150 || content.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message:
          "Title must not exceed 150 characters and content must not exceed 5000 characters",
        status_code: 400,
      });
    }

    const post = await Post.create({
      author: req.user.userId,
      title: title.trim(),
      content: content.trim(),
    });

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "name username profilePic",
    );

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      status_code: 201,
      post: populatedPost,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create post",
      status_code: 500,
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20),
    );

    const [posts, totalPosts] = await Promise.all([
      Post.find()
        .populate("author", "name username profilePic")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      status_code: 200,
      count: posts.length,
      totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve posts",
      status_code: 500,
    });
  }
};

export const getOnePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
        status_code: 400,
      });
    }

    const post = await Post.findById(id)
      .populate("author", "name username profilePic")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "name username profilePic",
        },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        status_code: 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      status_code: 200,
      post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve post",
      status_code: 500,
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
        status_code: 400,
      });
    }

    if (title === undefined && content === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide a title or content to update",
        status_code: 400,
      });
    }

    const updates = {};

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 150
      ) {
        return res.status(400).json({
          success: false,
          message: "Title is required and must not exceed 150 characters",
          status_code: 400,
        });
      }

      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (
        typeof content !== "string" ||
        !content.trim() ||
        content.trim().length > 5000
      ) {
        return res.status(400).json({
          success: false,
          message: "Content is required and must not exceed 5000 characters",
          status_code: 400,
        });
      }

      updates.content = content.trim();
    }

    const post = await Post.findOneAndUpdate(
      { _id: id, author: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true },
    ).populate("author", "name username profilePic");

    if (!post) {
      const exists = await Post.exists({ _id: id });

      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not authorized to update this post"
          : "Post not found",
        status_code: exists ? 403 : 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      status_code: 200,
      post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update post",
      status_code: 500,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
        status_code: 400,
      });
    }

    const post = await Post.findOneAndDelete({
      _id: id,
      author: req.user.userId,
    });

    if (!post) {
      const exists = await Post.exists({ _id: id });

      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not authorized to delete this post"
          : "Post not found",
        status_code: exists ? 403 : 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      status_code: 200,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete post",
      status_code: 500,
    });
  }
};
