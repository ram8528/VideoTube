import mongoose, { isValidObjectId } from "mongoose";
import { validateObjectId } from "../utils/validator.js";
import { Subscription } from "../models/subscription.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  const userId = req.user?._id;

  validateObjectId(userId, "User ID");

  validateObjectId(channelId, "Channel ID");

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    // unsubscribe
    await Subscription.deleteOne({
      _id: existingSubscription._id,
    });

    return res
      .status(200)
      .json(new apiResponse(200, "Unsubscribed Successfully"));
  } else {
    const newSubscription = new Subscription({
      subscriber: userId,
      channel: channelId,
    });

    await newSubscription.save();

    return res
      .status(201)
      .json(new apiResponse(201, newSubscription, "Subscribed Successfully"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  validateObjectId(channelId, "Channel ID");

  const subscribers = await Subscription.find({
    channel: channelId,
  })
    .populate("subscriber", "username email")
    .exec();

  if (!subscribers || subscribers.length === 0) {
    throw new apiError(404, "No subscriber found for this channel");
  }

  const subscriberList = subscribers.map((sub) => sub.subscriber);

  return res
    .status(200)
    .json(
      new apiResponse(200, subscriberList, "Subscribers retrieved successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  validateObjectId(subscriberId, "Subscriber ID");

  const subscriptions = await Subscription.find({ subscriber: subscriberId })
    .populate("channel", "username email")
    .populate("subscriber", "username email")
    .exec();

  if (!subscriptions || subscriptions.length === 0) {
    throw new apiError(404, "No subscriptions found for this channel");
  }

  const channelList = subscriptions.map((sub) => sub.channel);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        channelList,
        "Subscribed channels retrieved successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
