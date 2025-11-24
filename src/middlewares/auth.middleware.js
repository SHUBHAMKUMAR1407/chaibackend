import asyncHandler from "express-async-handler";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";




export const verifyJWT = asyncHandler(async(req, _, next) => {

      try {
         const token = req.cookies?.accessToken || res.header
         ("Authorization")?.replace("Bearer ", "") 
         
         if (!token) {
               throw new ApiError(401, "unauthorized, no token")
         }
  
         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) 
  
         const user = await User.findById(decodedToken?._id).select("-password -refreshTokens")    
         if (!user) { 
                  throw new ApiError(401, "unauthorized, user not found")
           }
  
           req.user = user
              next()
      } catch (error) {

            throw new ApiError(401, error?.message || "invalid access token")  
        
      }
  }) 

export default verifyJWT;
