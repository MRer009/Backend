import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// hear userid came from to the user because the username and password are correct
const genrateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.genrateAccessToken();
    const refreshToken = user.genrateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // we don't need validation here as it is already validated

    // return access and refresh token
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(500, "Server Error  while genrating tocken");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user detail from frontend
  //validation
  //check if already exist : username , email
  //images , avatar
  // upload them  to cloudinary
  // create object - create entry db
  // remove password and refrash token feild
  //check for user creation
  //return res

  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "All feild required");
  }

  const existedUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existedUser) {
    throw new ApiError(409, "Email or Username Already Exist");
  }

  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is mendetory");
  }

  //because the files are big like 5mb 7mb than await for the upload
  const avatar = await uploadOnCloud(avatarLocalPath);
  const coverImage = await uploadOnCloud(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is mendetory");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    //hear we check the coverImage validation because of we not check erlier coverIamege exists
    coverImage: coverImage ? coverImage.url : "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUSer = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (createdUSer) {
    throw new ApiError(500, "Server Error");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUSer, "Created user Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //todoes
  // req => body data
  //id password otp username or email
  //find user
  //password check
  //access and refresh token
  //send secure cookie

  //data from req body
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  //usercheck
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect  Password");
  }

  //get token
  const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
    user._id
  );

  //db query
  const loggedInUSer = await User.findById(User._id).select(
    "-password -refreshToken"
  );

  // saved in cookie
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUSer,
          accessToken,
          refreshToken,
        },
        "user Logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //user find
  //cookie and user reset
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  res
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, "Logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const upComingrefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!upComingrefreshToken) {
    throw new ApiError(401, "unauthorized access");
  }

  try {
    const deecoded = jwt.verify(
      upComingrefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(deecoded?._id);

    if (!user) {
      throw new ApiError(401, "invalid refreshtoken ");
    }

    if (user?.refreshToken !== upComingrefreshToken) {
      throw new ApiError(401, "refreshtoken is used");
    }
    const option = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await genrateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .clearCookie("accessToken", accessToken)
      .clearCookie("refreshToken", newRefreshToken)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refresed"
        )
      );
  } catch (error) {
    throw ApiError(400, "invalid refreshtoken");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is wrong");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "passwordchange"));
});

const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fatch successfully"));
});

const updateAccount = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "please provide all fields");
  }

  const user = User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "account updated"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is mendetory");
  }

  const avatar = await uploadOnCloud(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar Image update "));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverIamegeLocalPath = req.file?.path;
  if (!coverIamegeLocalPath) {
    throw new ApiError(400, "coverImage file is mendetory");
  }

  const coverImage = await uploadOnCloud(coverIamegeLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image update "));
});

const getUserChannalProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new ApiError(400, "userName is missing");
  }

  const channal = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channal",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subcribedTo",
      },
    },
    {
      $addFields: {
        subsribersCount: {
          $size: "$subscribers",
        },
        channalsSubsribedToCount: {
          $size: "$subcribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: (req.user?._id, "$subscribers.subscriber") },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subsribersCount: 1,
        channalsSubsribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  console.log(channal);
  if (!channal?.length) {
    throw new ApiError(404, "channal does not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channal[0], "user channal fatched succesfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        " Watch history fetched successfull"
      )
    );
});

export {
  registerUser,
  loginUser,
  currentUser,
  logoutUser,
  changeCurrentPassword,
  refreshAccessToken,
  updateAccount,
  updateAvatar,
  updateCoverImage,
  channal,
  getUserChannalProfile,
  getWatchHistory,
};
