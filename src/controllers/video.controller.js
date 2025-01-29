import mongoose, { isValidObjectId } from "mongoose";
import { validateObjectId } from "../utils/validator.js";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  // calculate the number of documents to skip for pagination
  const skip = (page - 1) * limit;

  // initialize an empty fiter object to build query condition
  const filter = {};

  // Add a filter for videos owned by a specific user(if userId is provided)
  if (userId) {
    filter.owner = new mongoose.Types.ObjectId(userId);
  }

  if (query) {
    filter.$or = [
      {
        title: {
          $regex: query,
          $options: "i",
        },
      },
      {
        description: {
          $regex: query,
          $options: "i",
        },
      },
    ];
  }

  const pipeline = [
    {
      $match: filter,
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: parseInt(limit),
    },
  ];

  const videos = await Video.aggregate(pipeline);

  const totalCount = await Video.countDocuments(filter);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        data: videos,
        totalCount: totalCount, // Total number of matching documents
        skip: skip, // Number of documents skipped
        limit: limit, // Number of documents per page
      },
      "Videos retrieved successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!(title && description)) {
    return apiError(400, "Title and Descriptions required");
  }

  // Validating the title and description length
  if (title.length > 100 || description.length > 500) {
    throw new apiError(
      400,
      "Title or Description Length does not meet the criteria"
    );
  }

  // check if a video with same title and description aleready exists
  const existingVideo = await Video.findOne({ title, description });
  if (existingVideo) {
    throw new apiError(400, "Video with same title and description detected");
  }

  const videoFilePath = req.files?.videoFile[0].path;
  const thumbnailPath = req.files?.thumbnail[0].path;

  if (!videoFilePath || !thumbnailPath) {
    throw new apiError(400, "Missing video file or thumbnail missing");
  }

  // Validate thumbnail file type
  const thumbnailFile = req.files.thumbnail[0];
  const allowedThumbnailTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedThumbnailTypes.includes(thumbnailFile.mimetype)) {
    throw new apiError(
      400,
      "Invalid thumbnail file type. Only jpg, jpeg, and png are allowed"
    );
  }

  const videoFile = await uploadOnCloudinary(videoFilePath);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  // validate the videofile length
  if (videoFile.size > 500 * 1024 * 1024) {
    throw new apiError(400, "Video file size is too large");
  }
  // validate thumbnail Length
  if (thumbnail.size > 100 * 1024 * 1024) {
    throw new apiError(400, "thumbnail size is too large");
  }

  const duration = videoFile?.duration;

  const video = await Video.create({
    // videoFile: videoFile.url,
    videoFile: videoFile.secure_url,
    // thumbnail : thumbnail.url,
    thumbnail: thumbnail.secure_url,
    title,
    description,
    duration,
    owner: req.user?._id,
  });

  if (!video) {
    throw new apiError(500, "Video upload failed");
  }

  video.isPublished = true;
  await video.save();

  return res
    .status(201)
    .json(new apiResponse(201, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // console.log(videoId);
  //TODO: get video by id

  // if (!isValidObjectId(videoId)) {
  //   throw new apiError(400, "Invalid Video ID");
  // }
  validateObjectId(videoId, "Video ID");

  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullName"
  );

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  validateObjectId(videoId, "Video ID");

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(403, "You are not authorized to update this video");
  }

  const { title, description } = req.body;
  const thumbnailPath = req.files?.path;

  const updateData = { title, description };

  if (thumbnailPath) {
    if (video.thumbnail) {
      const publicId = video.thumbnail.split("/").pop().split(".")[0];
      await uploadOnCloudinary.uploader.destroy(publicId);
    }

    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!thumbnail.url) {
      throw new apiError(400, "Error while uploading thumbnail");
    }

    updateData.thumbnail = thumbnail.url;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: updateData,
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new apiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  validateObjectId(videoId, "Video ID");

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apiError(400, "Video not found ");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(403, "You are not authorized to delete this video");
  }

  try {
    if (video.videoFile) {
      const publicId = video.videoFile.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    if (video.thumbnail) {
      const publicId = video.thumbnail.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    throw new apiError(500, "Error deleting video from cloudinary");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  validateObjectId(videoId, "Video ID");

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apiError(404, "Video with this id not found");
  }

  video.isPublished = !video.isPublished;

  const updatedVideo = await video.save();

  return res.status(200).json(
    new apiResponse(
      200,
      {
        isPublished: updatedVideo.isPublished,
      },
      "Video publish status updated successfully"
    )
  );
});

const getVideoByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  validateObjectId(userId, "User ID");

  const videos = await Video.find({ owner: userId }).populate(
    "owner",
    "username"
  );

  if (!videos.length) {
    throw new apiError(404, "No videos found for this user");
  }

  return res
    .status(200)
    .json(new apiResponse(200, videos, "Videos found Successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getVideoByUserId,
};
