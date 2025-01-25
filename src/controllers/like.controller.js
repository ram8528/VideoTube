import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Video Id is invalid");
  }

  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "video like removed successfully"));
  } else {
    await Like.create({ video: videoId, likedBy: userId });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Video Liked by User"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const userId = req.user?._id;

  if (!isValidObjectId(commentId)) {
    throw new apiError(404, "Comment Id is invalid");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Comment like removed successfully"));
  } else {
    await Like.create({ comment: commentId, likedBy: userId });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Comment Liked by user successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;
  //TODO: toggle like on tweet

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Tweet Id is invalid");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Tweet like removed successfully"));
  } else {
    await Like.create({ tweet: tweetId, likedBy: userId });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Tweet Liked By User Successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new apiError(400, "User Id is invalid");
  }

  const likedVideos = await Like.find({
    likedBy: userId,
    video: { $ne: null },
  }).populate("video"); // ne -> not equal

  if (likedVideos.length === 0) {
    throw new apiError(404, "No liked Video find by the user");
  }
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        likedVideos,
        "Liked Videos By User Retrieved Successfully"
      )
    );
});

const getLikedComments = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId) {
    throw new apiError(400, "UserId is invalid");
  }

  const likedComments = await Like.find({
    likedBy: userId,
    comment: { $ne: null },
  }).populate("comment");

  if (likedComments.length === 0) {
    throw new apiError(404, "No liked comment found for this user ");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        likedComments,
        "Liked Comments Retrieved successfully"
      )
    );
});

const getLikedTweets = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!isValidObjectId(userId)) {
    throw new apiError(400, "Invalid UserId Found");
  }

  const likedTweets = await Like.find({
    likedBy: userId,
    tweet: { $ne: null },
  }).populate("tweet");

  if (likedTweets.length === 0) {
    throw new apiError(404, "No liked tweets found for this user");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, likedTweets, "Liked Tweets retrieved successfully")
    );
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getLikedComments,
  getLikedTweets,
};
