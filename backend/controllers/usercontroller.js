const User = require("../models/usermodel");
const fs=require('fs')
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cloudinary=require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});


const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};


const register=async(req,res)=>{
    try{

        const {username,email,password,confirmpassword}=req.body;

        if(!username || !email || !password || !confirmpassword){
            return res.status(400).json({message:"All fields are required"});
        }


        if (!email.endsWith('@gmail.com')) {
           return res.status(400).json({ message: 'Only Gmail accounts are allowed' });
       }
        // Check if user already exists
        const existingUser=await User.findOne({email,username});
        if(existingUser){
            return res.status(400).json({message:"User already exists"});
        }

        if(password !== confirmpassword){
            return res.status(400).json({message:"Passwords do not match"});
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
    res.status(201).json({message:"User registered successfully",user:newuser,token:jwttoken});
    }

    catch(err){
        console.log(err);
        if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
      }
        res.status(500).json({message:"Server Error"});
    }

}


const login=async(req,res)=>{
    try{

        const {email,password}=req.body;

        if(!email || !password){
            return res.status(400).json({message:"All fields are required"});
        }

        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid credentials"});
        }

        const passwordmatch=await bcrypt.compare(password,user.password);
        if(!passwordmatch){
            return res.status(400).json({message:"Invalid credentials"});
        }
        const jwttoken=generateToken(user);


        console.log(user);
        res.status(200).json({message:"Login successful",user,token:jwttoken});
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


const updateProfile=async(req,res)=>{
    try{
        const userId = req.params.userId;
        const {password}=req.body;

        const user=await User.findById(userId);

        if(!user){
            return res.status(404).json({message:"User not found"});
        }


        if(password){
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
            user.password=hashedPassword;

            let profileImageUrl = '';
            if (req.file) {
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
             folder: 'profile_images',
            resource_type: 'image'
            });
            profileImageUrl = result.secure_url;
            }

            user.profilePhoto = profileImageUrl;



            await user.save();
            res.status(200).json({message:"Password updated successfully"});

        }

    }


    catch(err){        
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }

}


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



module.exports={register,login,getProfile,updateProfile,searchUsers,getOnlineUsers};