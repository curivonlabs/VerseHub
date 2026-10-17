import express from "express";
import {
  createPost,
  getAllPosts,
  getOnePost,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
} from "../controllers/post.comment.controller.js";
import { togglePostLike } from "../controllers/post.like.controller.js";
import {
  savePoem,
  unsavePoem,
  getSavedPoems,
} from "../controllers/post.save.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, createPost).get(getAllPosts);

router.get("/saved", protect, getSavedPoems);
router.post("/:postId/like", protect, togglePostLike);
router.post("/:postId/save", protect, savePoem);
router.delete("/:postId/save", protect, unsavePoem);

router
  .route("/:id")
  .get(getOnePost)
  .patch(protect, updatePost)
  .delete(protect, deletePost);

router
  .route("/:postId/comments")
  .post(protect, createComment)
  .get(getPostComments);

router
  .route("/comments/:commentId")
  .patch(protect, updateComment)
  .delete(protect, deleteComment);

export default router;