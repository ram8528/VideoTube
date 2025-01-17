import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(VerifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/createTweet").post(createTweet);
router.route("/user/:userId").get(getUserTweets);

router.patch("/:tweetId", updateTweet);
router.delete("/:tweetId", deleteTweet);

// router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
