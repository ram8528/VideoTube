import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  getVideoByUserId,
} from "../controllers/video.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public Route: No JWT needed for fetching all videos
router.get("/", getAllVideos);

// Public Route: No JWT needed for viewing a specific video
router.get("/:videoId", getVideoById);

// Route for Fetching User specific Videos Library
router.get("/user/:userId", getVideoByUserId);

// Apply JWT middleware for routes that require authentication
router.use(VerifyJWT);

// Protected Route: Publish a video (requires JWT for authentication)
router.post(
  "/publishAVideo",
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

// Protected Route: Delete a video (requires JWT for authentication)
router.delete("/:videoId", deleteVideo);

// Protected Route: Update a video (requires JWT for authentication)
router.patch("/:videoId", upload.single("thumbnail"), updateVideo);

// Protected Route: Toggle publish status (requires JWT for authentication)
router.patch("/toggle/publish/:videoId", togglePublishStatus);

export default router;

// const router = Router();
// router.use(VerifyJWT); // Apply verifyJWT middleware to all routes in this file

// router
//     .route("/")
//     .get(getAllVideos)
//     .post(
//         upload.fields([
//             {
//                 name: "videoFile",
//                 maxCount: 1,
//             },
//             {
//                 name: "thumbnail",
//                 maxCount: 1,
//             },

//         ]),
//         publishAVideo
//     );

// router
//     .route("/:videoId")
//     .get(getVideoById)
//     .delete(deleteVideo)
//     .patch(upload.single("thumbnail"), updateVideo);

// router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

// export default router
