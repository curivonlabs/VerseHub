
import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";

export const deleteUserCompletely = async (userId) => {
  const session = await mongoose.startSession();

  try {
    let deletedUser;

    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);

      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      const posts = await Post.find({ author: user._id })
        .select("_id")
        .session(session);

      const postIds = posts.map((post) => post._id);

      const comments = await Comment.find({
        $or: [
          { author: user._id },
          { postId: { $in: postIds } },
        ],
      })
        .select("_id")
        .session(session);

      const commentIds = comments.map((comment) => comment._id);

      await User.updateMany(
        {},
        {
          $pull: {
            followers: user._id,
            following: user._id,
          },
        },
        { session }
      );

      await Post.updateMany(
        {},
        {
          $pull: {
            likes: user._id,
            comments: { $in: commentIds },
          },
        },
        { session }
      );

      await Comment.updateMany(
        {},
        { $pull: { likes: user._id } },
        { session }
      );

      if (commentIds.length > 0) {
        await Comment.deleteMany(
          { _id: { $in: commentIds } },
          { session }
        );
      }

      if (postIds.length > 0) {
        await Post.deleteMany(
          { _id: { $in: postIds } },
          { session }
        );
      }

      await User.deleteOne({ _id: user._id }, { session });

      deletedUser = {
        id: user._id.toString(),
      };
    });

    return deletedUser;
  } finally {
    await session.endSession();
  }
};
