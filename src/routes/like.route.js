import { Router } from 'express';
import {
    getLikedVideos,
    getLikedComments ,
    getLikedTweets,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controller.js"
import {VerifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(VerifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);
router.route("/comments").get(getLikedComments);
router.route("/tweets").get(getLikedTweets);

export default router