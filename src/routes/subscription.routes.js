import {Router} from 'express'
import { verifyJWT } from "../midleware/auth.midleware.js"
import {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels, getSubscribedChannelsWithLatestVideo} from "../controlers/subscriptions.controller.js"

const router = Router();


router.route("/c/:channelId").post(verifyJWT, toggleSubscription)
router.route("/c/:channelId").get(verifyJWT, getUserChannelSubscribers)
router.route("/user/:channelId").get(verifyJWT, getSubscribedChannelsWithLatestVideo)
router.route("/subscribed/:subscriberId").get(verifyJWT, getSubscribedChannels)


 export default router
