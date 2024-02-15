import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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

export { registerUser, loginUser, logoutUser, refreshAccessToken };
