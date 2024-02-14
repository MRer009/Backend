import { Router } from "express";
import { upload } from "../middlewaers/multer.middlewaers.js";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    //avatar , images
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

export default router;
