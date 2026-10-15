import mongoose from "mongoose";

import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { deleteUserCompletely } from "../services/deleteUserCompletely.js";

const validRoles = ["user", "admin"];
const validSortFields = ["createdAt", "name", "username", "email", "role"];

const isValidObjectId = (id) =>
  typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

const createAdminError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
};

const parsePositiveInteger = (value, fallback, maximum) => {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    return null;
  }

  return parsed;
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const handleAdminError = (res, error, context) => {
  console.error(`Admin controller error (${context}):`, error);

  const statusCode = error.statusCode;

  if ([400, 404, 409].includes(statusCode)) {
    const messages = {
      400: "Invalid request",
      404: "User not found",
      409: "Operation conflicts with a security rule",
    };

    return res.status(statusCode).json({
      success: false,
      message: error.publicMessage || messages[statusCode],
      status_code: statusCode,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    status_code: 500,
  });
};

export const getAdminDashboard = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const [
      totalUsers,
      totalAdmins,
      totalPosts,
      totalComments,
      newUsersLastSevenDays,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Post.countDocuments(),
      Comment.countDocuments(),
      User.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      }),
      User.find()
        .select("_id name username email role createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin dashboard fetched successfully",
      status_code: 200,
      data: {
        statistics: {
          totalUsers,
          totalAdmins,
          totalPosts,
          totalComments,
          newUsersLastSevenDays,
        },
        recentUsers: recentUsers.map((user) => ({
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        })),
      },
    });
  } catch (error) {
    return handleAdminError(res, error, "getAdminDashboard");
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const {
      page: pageQuery,
      limit: limitQuery,
      search,
      role,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const page = parsePositiveInteger(pageQuery, 1, 1000000);
    const limit = parsePositiveInteger(limitQuery, 20, 100);

    if (page === null || limit === null) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
        status_code: 400,
      });
    }

    if (
      search !== undefined &&
      (typeof search !== "string" ||
        !search.trim() ||
        search.trim().length > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Search must contain between 1 and 100 characters",
        status_code: 400,
      });
    }

    if (role !== undefined && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be user or admin",
        status_code: 400,
      });
    }

    if (
      typeof sortBy !== "string" ||
      !validSortFields.includes(sortBy)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort field",
        status_code: 400,
      });
    }

    if (
      typeof sortOrder !== "string" ||
      !["asc", "desc"].includes(sortOrder)
    ) {
      return res.status(400).json({
        success: false,
        message: "Sort order must be asc or desc",
        status_code: 400,
      });
    }

    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (search !== undefined) {
      const escapedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { name: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
      ];
    }

    const direction = sortOrder === "asc" ? 1 : -1;

    const [users, totalUsers] = await Promise.all([
      User.aggregate([
        { $match: filter },
        {
          $sort: {
            [sortBy]: direction,
            _id: direction,
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            name: 1,
            username: 1,
            email: 1,
            role: 1,
            bio: 1,
            profilePic: 1,
            createdAt: 1,
            followersCount: {
              $size: { $ifNull: ["$followers", []] },
            },
            followingCount: {
              $size: { $ifNull: ["$following", []] },
            },
          },
        },
      ]),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      status_code: 200,
      data: {
        users: users.map((user) => ({
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          bio: user.bio,
          profilePic: user.profilePic,
          createdAt: user.createdAt,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
        })),
        pagination: {
          page,
          limit,
          totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
          hasNextPage: page * limit < totalUsers,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    return handleAdminError(res, error, "getAdminUsers");
  }
};

export const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        status_code: 400,
      });
    }

    const user = await User.findById(id)
      .select(
        "_id name username email role bio profilePic createdAt updatedAt followers following"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status_code: 404,
      });
    }

    const [postsCount, commentsCount] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      Comment.countDocuments({ author: user._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      status_code: 200,
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          bio: user.bio,
          profilePic: user.profilePic,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          followersCount: Array.isArray(user.followers)
            ? user.followers.length
            : 0,
          followingCount: Array.isArray(user.following)
            ? user.following.length
            : 0,
          postsCount,
          commentsCount,
        },
      },
    });
  } catch (error) {
    return handleAdminError(res, error, "getAdminUserById");
  }
};

export const updateAdminUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body ?? {};

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
      status_code: 400,
    });
  }

  if (typeof role !== "string" || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be user or admin",
      status_code: 400,
    });
  }

  if (id.toLowerCase() === req.user.userId.toLowerCase()) {
    return res.status(403).json({
      success: false,
      message: "You cannot change your own role",
      status_code: 403,
    });
  }

  const session = await mongoose.startSession();

  try {
    let updatedUser;

    await session.withTransaction(async () => {
      const user = await User.findById(id).session(session);

      if (!user) {
        throw createAdminError(404, "User not found");
      }

      if (user.role !== role && user.role === "admin" && role === "user") {
        const adminCount = await User.countDocuments({
          role: "admin",
        }).session(session);

        if (adminCount <= 1) {
          throw createAdminError(
            409,
            "At least one administrator must remain"
          );
        }
      }

      user.role = role;

      await user.save({ session });

      updatedUser = {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      status_code: 200,
      data: { user: updatedUser },
    });
  } catch (error) {
    return handleAdminError(res, error, "updateAdminUserRole");
  } finally {
    await session.endSession();
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        status_code: 400,
      });
    }

    if (id.toLowerCase() === req.user.userId.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Use the account deletion process to delete your own account",
        status_code: 403,
      });
    }

    const deletedUser = await deleteUserCompletely(id);

    console.info(
      JSON.stringify({
        event: "admin.user_deleted",
        adminUserId: req.user.userId,
        deletedUserId: deletedUser.id,
        occurredAt: new Date().toISOString(),
      })
    );

    return res.status(200).json({
      success: true,
      message: "User and related data deleted successfully",
      status_code: 200,
      data: {
        deletedUserId: deletedUser.id,
      },
    });
  } catch (error) {
    return handleAdminError(res, error, "deleteAdminUser");
  }
};
