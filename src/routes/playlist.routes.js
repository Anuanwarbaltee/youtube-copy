import { Router } from "express";
import { verifyJWT } from "../midleware/auth.midleware.js";
import {
    createPlaylist,
    getUserPlayList,
    getPlaylistById,
    addVideoToPlayList

} from "../controlers/playlist.controller.js"

const router = Router();
router.use(verifyJWT)
router.route("/").post(createPlaylist)
// router.route("/:userId").get(getUserPlayList)
router.route("/:playListId").get(getPlaylistById)
router.route("/add/:vedioId/:playListId").patch(addVideoToPlayList)



export default router