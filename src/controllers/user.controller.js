import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // getting user details from frontend
  // validating user details - - not empty
  // check if the user already exists (username,email)
  // check if images and avatars exists
  // upload them to cloudinary
  // create user object - create entry in database
  // remove password and refresh token from the response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  } // check for empty fields

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(409, "User with email or username already existed");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path; // req.file access has been provide by multer which gives us the path of the file

  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;  --> it would give error if coverImage not passed

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files?.coverImage) &&
    req.files?.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(400, "Failed to upload avatar file");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // removing password and refresh token

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> database
  // username or email
  // find the user
  // if user exist then check the password
  // access and refresh token
  // send cookie

  const { username, email, password } = req.body;

  if (!(username || email)) {
    // logically mistake if(!u || !e)
    throw new apiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiError(404, "User does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,   /// or use set and then refreshToken : null
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new apiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // if there could be a confirmpassword
  // const {oldPassword,newPassword,confirmpassword} if(newPass== confpass)

  const user = await User.findById(req.user?._id); // req.user.id

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid old Password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current User Fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new apiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName, // fullName
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Account Details Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new apiError(400, "Error while uploading on avatar");
  }
  // to delete the previousImage uploaded on Cloudinary and update new one
  const user = await User.findById(req.user?._id).select("avatar");

  if(user.avatar) {
    const publicId = user.avatar.split('/').pop().split('.')[0];
    // const publicId = cloudinary.utils.extractPublicId(user.avatar);
    await cloudinary.uploader.destroy(publicId);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, "Avatar Image Updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new apiError(400, "Cover Image file not found");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new apiError(400, "Cover Image not uploaded on cloudinary");
  }
  // Delete old coverimage
  const user = await User.findById(req.user?._id).select("coverImage");

  if(user.coverImage) {
    const publicId = user.coverImage.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, "Cover Image Updated Successfully"));
});

const getUserChannelProfile = asyncHandler (async(req,res) => {
    const {username} = req.params;

    if(!username?.trim()) {
        throw new apiError(400,"Username is missing");
    }

    const channel = await User.aggregate([
      {
        $match: {
          username: username?.toLowerCase()
        }
      },
      {
        $lookup: {
          from: "subscriptions", // db me sb small aur plural ho jate h(look in subscription model)
          localField : "_id",
          foreignField : "channel",
          as : "subscribers"
        }
      },
      {
        $lookup : {
          from: "subscriptions", // db me sb small aur plural ho jate h(look in subscription model)
          localField : "_id",
          foreignField : "subscriber",
          as : "subscribedTo"
        }
      },
      {
        $addFields: {
          subscribersCount : {
            $size : "$subscribers" // because subscribers is now a feild so we have used $ before subscribers
          },
          channelsSubscribedTo : {
            $size : "$subscribedTo"
          },
          isSubscribed : {
            $cond : {
              if: {$in: [req.user?._id, "$subscribers.subscriber"]}, // subscribers.subscriber ke andar check kr lo ki id hai ya nhi (in jo h wo array ar object dono me dekh leta h aur yha pr to object h)
              then: true,
              else: false
            }
          }
        }
      },
      {
        $project: {
          fullName : 1,
          username : 1,
          subscribersCount : 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1
        }
      }
    ])

    if(!channel?.length) {
      throw new apiError (404, "Channel does not exist")
    }

    return res
    .status(200)
    .json(
      new apiResponse(
        200,
        channel[0],
        "User Channel fetched successfully"
      )
    )
});

const getWatchHistory = asyncHandler (async (req,res) => {
    const user = await User.aggregate([
      {
        $match : {
          _id : new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $lookup : {
          from : "videos",
          localField : "watchHistory",
          foreignField : "_id",
          as : "watchHistory",
          pipeline : [
            {
              $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner", 
                pipeline : [
                  {
                    $project : {
                      fullName : 1,
                      username : 1,
                      avatar : 1
                    }
                  }
                ]
              }
            },
            {
              $addFields : {
                owner : {
                  $first : "$owner"
                }
              }
            }
          ]
        }
      }
    ])

    return res.status(200)
    .json(
      new apiResponse(
        200,
        user[0].watchHistory,
        "Watch History Received Syccessfully"
      )
    )
});


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
