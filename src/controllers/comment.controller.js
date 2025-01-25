import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Video Id does not exist");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  const comments = await Comment.find({
    video: videoId,
  })
    .populate("owner", "username")
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  return res
    .status(200)
    .json(new apiResponse(200, comments, "Comments retrieved successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body;

  if (!content) {
    throw new apiError(400, "No content found for comment");
  }

  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid Video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  const comment = new Comment({
    content,
    video: videoId,
    owner: req.user._id,
  });

  await comment.save();

  return res
    .status(200)
    .json(new apiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid Comment Id");
  }

  const comment = await Comment.findByIdAndUpdate(commentId);

  if (!comment) {
    throw new apiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new apiError(403, "You are not authorized to update the comment");
  }

  comment.content = content || comment.content;

  await comment.save();

  return res
    .status(200)
    .json(new apiResponse(200, comment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid Comment Id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new apiError(404, "No comment found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new apiError(403, "You are not authorized to delete the comment");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Comment removed successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
