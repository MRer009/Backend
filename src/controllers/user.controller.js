import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

  const existedUser = User.findOne({ $or: [{ email }, { username }] });

  if (existedUser) {
    throw new ApiError(409, "Email or Username Already Exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export { registerUser };
