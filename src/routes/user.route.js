import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar", // when frontend file be made this name would be taken in field
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(VerifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(VerifyJWT, changeCurrentPassword);

router.route("/current-user").get(VerifyJWT, getCurrentUser);

router.route("/update-account").patch(VerifyJWT, updateAccountDetails);

router
  .route("/avatar")
  .patch(VerifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/cover-Image")
  .patch(VerifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(VerifyJWT, getUserChannelProfile);
// c is just an alias it could be anything like channel or ram 
router.route("/history").get(VerifyJWT, getWatchHistory);
export default router;
