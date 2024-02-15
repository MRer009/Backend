// verify user logged in or not
import Jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Please log in to access this resource");
    }
    const deecodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
    const user = await User.findById(deecodedToken?._id).select(
      "-password -refreshToken"
    );
  
    if (!user) {
      throw new ApiError(401, "User does not exist");
    }
  
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401 , "Invalid access token" )
  }
});
