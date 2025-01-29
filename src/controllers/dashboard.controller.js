import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new apiError(400, "Invalid channel ID");
  }

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const videos = await Video.find({ owner: channelId });
  // console.log(videos)

  if (!Array.isArray(videos)) {
    throw new apiError(500, "Error retrieving videos for this channel");
  }

  const totalViews = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId)
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  const totalLikes = await Like.aggregate([
    {
      $match: {
        video: {
          $in: videos.map((video) => video._id),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: 1,
        },
      },
    },
  ]);

  const stats = {
    totalSubscribers,
    totalVideos : videos.length,
    totalViews: totalViews[0]?.totalViews || 0,
    totalLikes: totalLikes[0]?.totalLikes || 0,
  };

  return res
    .status(200)
    .json(new apiResponse(200, stats, "Channel status retrieved successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new apiError(400, "Invalid channel Id");
  }

  const videos = await Video.find({
    owner: channelId,
  }).populate("owner", "username");

  if (!videos || videos.length === 0) {
    throw new apiError(404, "No videos found for this channel");
  }

  const videoList = videos.map((video) => ({
    _id: video._id,
    title: video.title,
    views: video.views,
    description: video.description,
    duration: video.duration,
    thumbnail: video.thumbnail,
    owner: video.owner.username,
    email: video.owner.email,
  }));

  return res
    .status(200)
    .json(new apiResponse(200, videoList, "Videos retrieved successfully"));
});

export { getChannelStats, getChannelVideos };
