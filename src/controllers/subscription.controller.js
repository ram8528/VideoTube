import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new apiError(400, "User id is invalid");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    await Subscription.deleteOne({
      _id: existingSubscription._id,
    });

    return res
      .status(201)
      .json(new apiResponse(200, "Unsubscribed Successfully"));
  }

  const newSubscription = await Subscription.create({
    subscriber: userId,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new apiResponse(200, newSubscription, "Subscribed Successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscribers = await Subscription.find({
    channel: channelId,
  })
    .populate("subscriber", "username email")
    .exec();

  if (!subscribers || subscribers.length === 0) {
    throw new apiError(404, "No subscriber found for this channel");
  }

  const subscriberList = subscribers.map((sub) => sub.subscriber);

  if (!subscriberList || subscriberList.length === 0) {
    throw new apiError(400, "No subscriber list found for this channel");
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, subscriberList, "Subscribers retrieved successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
