import { Router } from "express";
import {
    publishAVideo,
    incrementVideoViews,
    togglePublishStatus,
    getAllVideos,
    getVideoById,
    deleteVideo,
    updateVideoThumbnail,
    updateVideo,
    } from "../controlers/video.controller.js"
import {upload} from "../midleware/multer.mildleware.js"
import { verifyJWT } from "../midleware/auth.midleware.js"



const router = Router()

router.route("/upload-video").post(upload.fields(
    [
        {
            name:"uservideoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    (req, res, next) => {
        console.log("Received body:", req.body);
        console.log("Received files:", req.files);
        next();
    },
    verifyJWT,
    publishAVideo
)
router.route("/:videoId/view").post( verifyJWT, incrementVideoViews)
router.route("/toggle/publish/:videoId").patch(verifyJWT,togglePublishStatus);
router.route('/list').get(verifyJWT, getAllVideos);
router.route('/:videoId').get(verifyJWT, getVideoById);
router.route('/:videoId').delete(verifyJWT, deleteVideo);
router.route("/update-thumbnail").patch(verifyJWT, upload.single("thumbnail") ,updateVideoThumbnail)
router.route("/update-video").patch(verifyJWT,updateVideo)
export default router