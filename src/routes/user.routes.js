import { Router } from "express";
import { upload } from "../middlewaers/multer.middlewaers.js";
import {
  changeCurrentPassword,
  currentUser,
  getUserChannalProfile,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccount,
  updateCoverImage,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewaers/auth.middlewaer.js";

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

router.route("/login").post(loginUser);

//secured route
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").post(verifyJWT, currentUser);
router.route("/update-account").patch(verifyJWT, updateAccount);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/channal/:username").get(verifyJWT, getUserChannalProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
