import { Router } from "express";
import { verifyJWT } from "../midleware/auth.midleware.js";
import {
    createPlaylist,
    getUserPlayList,
    getPlaylistById,
    addVideoToPlayList,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,

} from "../controlers/playlist.controller.js"

const router = Router();
router.use(verifyJWT)
router.route("/").post(createPlaylist)
router.route("/user/:userId").get(getUserPlayList)
router.route("/:playListId").get(getPlaylistById)
router.route("/add/:vedioId/:playListId").patch(addVideoToPlayList)
router.route("/delete/:vedioId/:playListId").patch(removeVideoFromPlaylist)
router.route("/delete/:playListId").patch(deletePlaylist)
router.route("/update/:playListId").patch(updatePlaylist)



export default router