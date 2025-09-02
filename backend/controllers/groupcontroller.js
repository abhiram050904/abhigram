const Group = require("../models/groupmodel");
const cloudinary = require('cloudinary').v2;

const creategroup=async(req,res)=>{
    try{

        const {name,description,members}=req.body;
        const admin=req.user.userId;

        const newGroup=new Group({
            name,
            description,
            admin,
            members:[admin,...members] // Admin is also a member
        })

        if(req.file){
            const result=await cloudinary.uploader.upload(req.file.path);
            newGroup.groupImage=result.secure_url;
        }

        await newGroup.save();
        res.status(201).json(newGroup);
    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal Server Error"});
    }
}


const getGroupdetails=async(req,res)=>{
    try{

        const {groupId}=req.params;
        const group=await Group.findById(groupId)
        .populate('admin','username profilePhoto')
        .populate('members','username profilePhoto')
        .populate('moderators','username profilePhoto')
        .populate('lastMessage');  

        if(!group){
            return res.status(404).json({message:"Group not found"});
        }   

        res.status(200).json({group});

    }
    catch(err){

    }
}


const updategroup=async(req,res)=>{
    try{

        const {groupId}=req.params;
        const {name,description}=req.body;

        const updates={name,description};

        if(req.file){
            const result=await cloudinary.uploader.upload(req.file.path);
            updates.groupImage=result.secure_url;
        }

        const group=await Group.findByIdAndUpdate(groupId,updates,{new:true}).populate('members', 'username profilePhoto isOnline');
        if(!group){
            return res.status(404).json({message:"Group not found"});
        }

        res.status(200).json({group});

    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal Server Error"});
    }
}


const addmemberstogroup=async(req,res)=>{
    try{

        const {groupId}=req.params;
        const {members}=req.body; // Array of user IDs to be added

        const group=await Group.findByIdAndUpdate({_id:groupId,
            admin:req.user.userId}, // Only admin can add members
            {$addToSet:{members:{$each:members}}},
            {new:true}
        ).populate('members','username profilePhoto isOnline');

        if(!group){
            return res.status(404).json({message:"Group not found"});
        }

        res.status(200).json({group});

    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal Server Error"});
    }
}


const deleteMembersFromGroup=async(req,res)=>{
    try{

        const {groupId}=req.params;
        const {members}=req.body; // Array of user IDs to be removed

        const group=await Group.findByIdAndUpdate({_id:groupId,
            admin:req.user.userId}, // Only admin can remove members
            {$pull:{members:{$in:members}}},
            {new:true}
        ).populate('members','username profilePhoto isOnline');

        if(!group){
            return res.status(404).json({message:"Group not found"});
        }

        res.status(200).json({group});

    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal Server Error"});
    }
}



const getgroupmessages=async(req,res)=>{
    try{

        const {groupId}=req.params;
        const messages=await Message.find({group:groupId,isGroupMessage:true})
        .populate('sender','username profilePhoto')
        .populate('read.user','username');

        res.status(200).json({messages});
    }
    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal Server Error"});
    }
}

module.exports={creategroup,getGroupdetails,updategroup,addmemberstogroup,deleteMembersFromGroup,getgroupmessages};