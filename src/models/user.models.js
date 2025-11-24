import express from 'express';
import mongoose, {Schema} from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new Schema({

    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },

     email:  {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,  
    },  

     fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

     avatar: {
        type: String,   //cloudinary url
        required: true,
    },

     coverImage: {
        type: String,  //cloudinary url
        required: false,
    },

     watchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    }],
     password : {
        type: String,
        required: [true, 'Password is required']
    },
    
    refreshTokens: {
        type: String,
    }

 },

    {  
        timestamps: true
    }

)

userSchema.pre('save', async function (next) { 
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (Password) {
    return await bcrypt.compare(Password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { 
            _Id: this._id, 
            username: this.username,
            email: this.email,
            fullName: this.fullName  
        },
        process.env.ACCESS_TOKEN_SECRET,
          {
             expiresIn: process.env.ACCESS_TOKEN_EXPIRES
          }
    ) 
};

    userSchema.methods.generateRefreshToken = function () {
        return jwt.sign(
            {   
     
                 _Id: this._id,          
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
    ) 
}


export const User = mongoose.model('User', userSchema);