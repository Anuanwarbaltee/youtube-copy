import { Router } from "express";
import { verifyJWT } from "../midleware/auth.midleware.js";
import { toggleVideoLikes } from "../controlers/likes.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle/:videoId").post(toggleVideoLikes)


export default router