import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.models.js";  
import { uploadToCloudinary } from "../utils/cloudinary.js";    
import {ApiResponse} from "../utils/ApiResponse.js";                   
import bcrypt from "bcryptjs";



const generateAccessAndRefreshTokens = async (userId) => {
       try {
             const user = await User.findById(userId);
             const accessToken = user.generateAccessToken()
             const refreshToken = user.generateRefreshToken()
             
             user.refreshTokens = refreshToken;
             await user.save({validateBeforeSave: false});
             
             return {accessToken, refreshToken};

            }
       catch (error) {
                throw new ApiError(500, "Failed to generate tokens");  
            }
};



const registerUser = asyncHandler(async (req, res) => {
    
// Steps to register a new user:
// 1. get user details from the frontend request
// 2. validation - not empty
// 3. Check if a user already exists (by username or email)
// 4. Verify if image or avatar is provided
// 5. Upload avatar/image to Cloudinary
// 6. Create a new user record in the database
// 7. Exclude sensitive fields (password, refresh token) from the response
// 8. Confirm user creation was successful
// 9. Return the appropriate response


   const {fullName, email, username, password} = req.body
       console.log("email", "fullName", "username", "password");


       if(
           [fullName, email, username, password].some((field) => 
            field?.trim() === "")
       ) {
        throw new ApiError(400, "All fields are required");
       }

       const existedUser = await User.findOne({
        $or: [{email}, {username}]})

        if(existedUser) {
            throw new ApiError(409, "User with provided email or username already exists");
        }
       const avatarLocalPath = req.files?.avatar?.[0]?.path;
       const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

        if(!avatarLocalPath || !coverImageLocalPath) {
            throw new ApiError(400, "Avatar and Image are required");
        }
       
        const avatarUrl = await uploadToCloudinary(avatarLocalPath);
        const coverImageUrl = await uploadToCloudinary(coverImageLocalPath);   
        if(!avatarUrl || !coverImageUrl) {
            throw new ApiError(500, "Failed to upload avatar or image");
        }

        const user = await User.create({
            fullName,
            email,
            username: username.toLowerCase(),
            password,
            avatar: avatarUrl,
            coverImage:coverImageUrl || ""
        });

        const createdUser = await User.findById(user._id).select(
            "-password -refreshTokens"
        );

        if(!createdUser) {
            throw new ApiError(500, "Failed to create user");
        }

      
        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered successfully")
        );
        
}); 



const loginUser = asyncHandler(async (req, res) => {
    // Steps to login a user:
    // 1. Get login credentials from the frontend request
    // 2. Validation - not empty
    // 3. Find the user by email or username
    // 4. If user not found, throw error
    // 5. Compare provided password with stored hashed password
    // 6. If password does not match, throw error
    // 7. Exclude sensitive fields from the response
    // 8. Return success response with user details

    const {email, username, password} = req.body;
        if(!username && !email) {
        throw new ApiError(400, "Email or Username is required");
      }
        const user = await User.findOne({
            $or: [{email}, {username}]
        });

        if(!user) {
            throw new ApiError(404, "User not found");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if(!isPasswordValid) {
            throw new ApiError(401, "Invalid password");
        }

       const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    
       const loggedInUser = await User.findById(user._id).select(
        "-password -refreshTokens"
        );
        
        const options = {
            httpOnly: true,
            secure: true
        }
        
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                    "User logged in successfully"
            )
        );

});



const logoutUser = asyncHandler(async (req, res) => {
    // Steps to logout a user:
    // 1. Clear the authentication cookies (accessToken and refreshToken)
    // 2. Return a success response confirming logout
    await User.findByIdAndUpdate(
       req.user._id,
        { 
            $set: {
                refreshTokens: undefined
            }
        },

        {
            new: true,
        }
    )

    const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, null, "User logged out successfully")
        );
 
});

export { 

    registerUser,
    loginUser,
    logoutUser
     
};

