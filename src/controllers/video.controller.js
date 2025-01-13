import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!(title && description)) {
    return apiError(400, "Title and Descriptions required");
  }

  const videoFilePath = req?.files?.video?.path;
  const thumbnailPath = req?.files?.thumbnail?.path;

  if (!(videoFilePath || thumbnailPath)) {
    throw new apiError(400, "Missing video file or thumbnail missing");
  }

  const videoFile = await uploadOnCloudinary(videoFilePath);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  const duration = videoFile.duration;

  const video = await Video.create({
    videoFile : videoFile.url,
    thumbnail : thumbnail.url,
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
  //TODO: get video by id

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid Video ID");
  }

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

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(403, "You are not authorized to update this video");
  }

  const { title, description } = req.body;
  const thumbnailPath = req.file?.path;

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
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

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
      await uploadOnCloudinary.uploader.destroy(publicId);
    }

    if (video.thumbnail) {
      const publicId = video.thumbnail.split("/").pop().split(".")[0];
      await uploadOnCloudinary.uploader.destroy(publicId);
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

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
