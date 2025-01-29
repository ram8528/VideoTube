import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {VerifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(VerifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    // .get(getSubscribedChannels)
    .post(toggleSubscription);

router
    .route("/c/:subscriberId")
    .get(getSubscribedChannels)

router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router