import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user?._id;

  //TODO: create playlist
  if (!isValidObjectId(userId)) {
    throw new apiError(400, "User ID is not valid");
  }

  if (!name || !description) {
    throw new apiError(400, "Playlist Name and Description are required");
  }

  const newPlaylist = new Playlist({
    name,
    description,
    owner: userId,
  });

  await newPlaylist.save();
  return res
    .status(200)
    .json(
      new apiResponse(200, newPlaylist, "User Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new apiError(400, "User Id is invalid");
  }

  const { page = 1, limit = 10 } = req.query;

  const playlists = await Playlist.find({ owner: userId })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const totalPlaylists = await Playlist.countDocuments({
    owner: userId,
  });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { playlists, totalPlaylists },
        "Playlist retrieved successfully"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "Playlist id is invalid");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new apiError(400, `Playlist with ID ${playlistId} not found`);
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(
      403,
      "You do not have permission to access this playlist"
    );
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new apiError(400, "Playlist Id or Video Id is invalid");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apiError(404, `Video with ID ${videoId} not found`);
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!playlist) {
    throw new apiError(404, `Playlist with ID ${playlistId} not found`);
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, playlist, "Video Added to the List successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new apiError(400, "Playlist Id or video Id is invalid");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, playlist, "Video removed from playlist successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "Playlist id is invalid");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }

  return res
    .status(204)
    .json(new apiResponse(204, {}, "Playlist Deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "Playlist id is invalid");
  }

  if (!name || !description) {
    throw new apiError(400, "Name and Description are required");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { name, description },
    { new: true, runValidators: true }
  );

  if (!updatedPlaylist) {
    throw new apiError(404, "Updated playlist not found");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedPlaylist, "Playlsit updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
