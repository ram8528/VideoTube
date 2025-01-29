import mongoose, { isValidObjectId } from "mongoose";
import { validateObjectId } from "../utils/validator.js";
import { Tweet } from "../models/tweet.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  if (!req.user || !req.user._id) {
    throw new apiError(401, "User not authenticated");
  }

  const { content } = req.body;

  if (!content) {
    throw new apiError(400, "Content is required");
  }
  // creating new tweet document
  const tweet = new Tweet({
    owner: req.user._id, // user id from the authenticated user
    content,
  });

  await tweet.save();

  const tweetCreated = await Tweet.findById(tweet._id).populate(
    "owner",
    "username"
  );

  if (!tweetCreated) {
    throw new apiError(500, "Tweet not created");
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweetCreated, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const userId = req.params.userId;
  // const {userId} = req.params;

  validateObjectId(userId, "User ID");

  const tweet = await Tweet.find({ owner: userId }).populate(
    "owner",
    "username"
  );

  if (!tweet || tweet.length === 0) {
    throw new apiError(404, "No tweets found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweet, "User Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;

  const { tweetId } = req.params;

  if (!content) {
    throw new apiError(400, "No content found");
  }

  validateObjectId(tweetId, "Tweet ID");

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new apiError(404, "Tweet not found");
  }
  // console.log(tweet.owner.toString())
  // console.log(req.user._id.toString());

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(404, "You are not authorized to update the tweet");
  }

  tweet.content = content;
  await tweet.save();

  return res
    .status(200)
    .json(new apiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  validateObjectId(tweetId, "Tweet ID");
  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new apiError(400, "No tweet found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new apiError(400, "You are not authorized to delete this tweet");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
