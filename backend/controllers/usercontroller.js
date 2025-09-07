const User = require("../models/usermodel");
const Message = require("../models/messagemodel");
const Group = require("../models/groupmodel");
const fs=require('fs')
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cloudinary=require('cloudinary').v2;
const mongoose = require('mongoose');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});


const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};


const register=async(req,res)=>{
    try{

        const {username,email,password,confirmpassword}=req.body;

        if(!username || !email || !password || !confirmpassword){
            return res.status(400).json({status: false, msg:"All fields are required"});
        }


        if (!email.endsWith('@gmail.com')) {
           return res.status(400).json({ message: 'Only Gmail accounts are allowed' });
       }
        // Check if user already exists
        const existingUser=await User.findOne({email,username});
        if(existingUser){
            return res.status(400).json({status: false, msg:"User already exists"});
        }

        if(password !== confirmpassword){
            return res.status(400).json({status: false, msg:"Passwords do not match"});
        }
        
        if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one special character (!@#$%^&*)' });
    }


        const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newuser=new User({
        username,
        email,
        password:hashedPassword
    });


    let profileImageUrl = '';
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'profile_images',
        resource_type: 'image'
      });
      profileImageUrl = result.secure_url;
    }

    newuser.profilePhoto = profileImageUrl;

    await newuser.save();

    const jwttoken=generateToken(newuser);


    console.log(newuser);
    res.status(201).json({status: true, message:"User registered successfully",user:newuser,token:jwttoken});
    }

    catch(err){
        console.log(err);
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        
        // Handle specific MongoDB errors
        if (err.code === 11000) {
            if (err.keyPattern.email) {
                return res.status(400).json({status: false, message: "Email already exists. Please use a different email."});
            }
            if (err.keyPattern.username) {
                return res.status(400).json({status: false, message: "Username already exists. Please choose a different username."});
            }
            return res.status(400).json({status: false, message: "User already exists with this information."});
        }
        
        res.status(500).json({status: false, message: "Registration failed. Please try again."});
    }

}


const login=async(req,res)=>{
    try{

        const {email,password}=req.body;

        if(!email || !password){
            return res.status(400).json({status: false, msg:"All fields are required"});
        }

        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({status: false, msg:"Invalid credentials"});
        }

        const passwordmatch=await bcrypt.compare(password,user.password);
        if(!passwordmatch){
            return res.status(400).json({status: false, msg:"Invalid credentials"});
        }
        const jwttoken=generateToken(user);


        console.log(user);
        res.status(200).json({status: true, message:"Login successful",user,token:jwttoken});
    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}


const getProfile=async(req,res)=>{
    try{

        const userId = req.params.userId;

        const user=await User.findById(userId).select('-password');

        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        console.log(user);

        res.status(200).json({user});
    }


    catch(err){        
        
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}


const updateProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const authUserId = req.user.userId;
        const { password, username } = req.body;

        if (userId !== authUserId) {
            return res.status(403).json({ message: 'Unauthorized to update this profile' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let updated = false;

        // Username update (optional)
        if (typeof username === 'string' && username.trim() && username.trim() !== user.username) {
            if (username.trim().length < 3) {
                return res.status(400).json({ message: 'Username must be at least 3 characters' });
            }
            // Ensure uniqueness
            const existing = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
            if (existing) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            user.username = username.trim();
            updated = true;
        }

        // Password update (optional)
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters long' });
            }
            if (!/[A-Z]/.test(password)) {
                return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
            }
            if (!/[a-z]/.test(password)) {
                return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
            }
            if (!/[0-9]/.test(password)) {
                return res.status(400).json({ message: 'Password must contain at least one number' });
            }
            if (!/[!@#$%^&*]/.test(password)) {
                return res.status(400).json({ message: 'Password must contain at least one special character (!@#$%^&*)' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            updated = true;
        }

        // Profile photo update (optional)
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'profile_images',
                resource_type: 'image'
            });
            user.profilePhoto = result.secure_url;
            updated = true;
        }

        if (!updated) {
            return res.status(200).json({ message: 'No changes submitted', user: await User.findById(userId).select('-password') });
        }

        await user.save();
        const sanitized = await User.findById(userId).select('-password');
        return res.status(200).json({ message: 'Profile updated successfully', user: sanitized });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ message: 'Server Error' });
    }
};


const searchUsers=async(req,res)=>{
    try{

        const {query}=req.body;
        const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: req.user.userId },
    }).select('username email profilePhoto isOnline lastSeen');


    console.log(users);
    res.status(200).json({users});

    }


    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal server error"});
    }
}


const getOnlineUsers=async(req,res)=>{
    try{
        const users=await User.find({isOnline:true,_id: { $ne: req.user.userId },}).select('username email profilePhoto lastSeen');

        console.log(users);
        res.status(200).json({users});

    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal server error"});
    }
}

const getRecentChats = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get recent messages involving the user
        const recentMessages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(userId) },
                        { receiver: new mongoose.Types.ObjectId(userId) }
                    ],
                    isGroupMessage: { $ne: true }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
                            "$receiver",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $unwind: "$userInfo"
            },
            {
                $project: {
                    _id: "$userInfo._id",
                    username: "$userInfo.username",
                    email: "$userInfo.email",
                    profilePhoto: "$userInfo.profilePhoto",
                    isOnline: "$userInfo.isOnline",
                    lastSeen: "$userInfo.lastSeen",
                    lastMessage: "$lastMessage"
                }
            },
            {
                $sort: { "lastMessage.createdAt": -1 }
            },
            {
                $limit: 20
            }
        ]);

        res.status(200).json({ recentChats: recentMessages });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getUserGroups = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const groups = await Group.find({
            members: userId
        })
        .populate('admin', 'username profilePhoto')
        .populate('members', 'username profilePhoto isOnline')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

        res.status(200).json({ groups });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};


module.exports={register,login,getProfile,updateProfile,searchUsers,getOnlineUsers,getRecentChats,getUserGroups};