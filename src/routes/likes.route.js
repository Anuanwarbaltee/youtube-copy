import { Router } from "express";
import { verifyJWT } from "../midleware/auth.midleware.js";
import { toggleVideoLikes,getUserChannelLikes, toggleCommentLikes, geLikedVideos } from "../controlers/likes.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/video/toggle/:videoId").post(toggleVideoLikes)
router.route("/comment/toggle/:commentId").post(toggleCommentLikes)
router.route("/:id").get(getUserChannelLikes)
router.route("/liked-videos/:id").get(geLikedVideos)


export default router