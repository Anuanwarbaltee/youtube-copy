import { Router } from "express";
import { verifyJWT } from "../midleware/auth.midleware.js";
import { addcomment ,
    getComments,
    updateComments,
    deleteComment
} from "../controlers/comment.controller.js";

const router = Router();
router.use(verifyJWT)

router.route("/").post(addcomment)
router.route("/list").post(getComments)
router.route("/delete/:commentId").delete(deleteComment)

export default router