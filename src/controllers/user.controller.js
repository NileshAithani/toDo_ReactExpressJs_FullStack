import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user data from frontend
  const { username, email, password } = req.body;

  //validation non-empty
  if ([username, email, password].some((field) => field?.trim === "")) {
    throw new ApiError(400, "All field are required");
  }

  //Check if the user is already exist or not
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "Username or email is already exists");
  }

  //Check for images, Check for avatar
  const avatarLocalPath = req.files?.avatar[0].path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar File is required");
  }

  //create user object - create entry in DB
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
  });

  //remove the password and refresh token from response field
  const createUser = await User.findById(user._id).select("-password ");

  //check the user Creation
  if (!createUser) {
    throw new ApiError(500, "Somthing went wrong, While registering the user");
  }
  console.log("User Created Successfully");
  return res
    .status(201)
    .json(new ApiResponse(200, createUser, "User registered Successfully"));
});

export { registerUser };
