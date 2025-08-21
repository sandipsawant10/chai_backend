import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  // get video id
  // set limit of comments (default page=1, limit=10)
  // convert query params to numbers
  // fetch comments with pagination
  // count total comments for this video
  // return if no comments found
  //return response with pagination
  const { videoId } = req.params;

  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const comments = await Comment.find({ video: videoId })
    .skip((page - 1) * limit) // skip previous comments
    .limit(limit) // limit number of comments
    .sort({ createdAt: -1 }); // sort comments in descending order (newest first)

  const totalComments = await Comment.countDocuments({ video: videoId });

  if (!comments.length) {
    return res
      .status(404)
      .json(ApiResponse(404, [], "No comments found for this video"));
  }

  return res.status(200).json(
    ApiResponse(
      200,
      {
        comments,
        pagination: {
          total: totalComments,
          page,
          limit,
          totalPages: Math.ceil(totalComments / limit),
        },
      },
      "Comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  // get video id
  // get comment content from request body
  // validate comment content
  // create new comment
  //return comment

  const { videoId } = req.params;

  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json(ApiResponse(400, null, "Content is required"));
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // get comment id
  // get new content from body
  // validate content
  // find comment
  // check if comment exists
  // check if comment belongs to user
  // update comment
  // return updated comment

  const { commentId } = req.params;

  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json(ApiResponse(400, null, "Content is required"));
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res.status(404).json(ApiResponse(404, null, "Comment not found"));
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(
        ApiResponse(403, null, "You are not allowed to update this comment")
      );
  }

  comment.content = content;
  await comment.save();

  return res
    .status(200)
    .json(ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // get comment id
  // validate comment id
  // find comment
  // check if comment exists
  // check if comment belongs to user
  // delete comment
  // return deleted comment

  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json(ApiResponse(400, null, "Invalid comment id"));
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res.status(404).json(ApiResponse(404, null, "Comment not found"));
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(
        ApiResponse(403, null, "You are not allowed to delete this comment")
      );
  }

  await comment.deleteOne();

  return res
    .status(200)
    .json(ApiResponse(200, comment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
