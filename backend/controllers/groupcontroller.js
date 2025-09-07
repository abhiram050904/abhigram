const Group = require("../models/groupmodel");
const Message = require("../models/messagemodel");
const cloudinary = require('cloudinary').v2;

const creategroup=async(req,res)=>{
    try {
        let { name, description, members } = req.body;
        const admin = req.user.userId;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        // members may arrive as JSON string from FormData
        if (typeof members === 'string') {
            try {
                members = JSON.parse(members);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid members format' });
            }
        }
        if (!Array.isArray(members)) {
            members = [];
        }

        // Deduplicate + exclude admin duplicates
        const uniqueMembers = [...new Set(members.filter(m => m && m !== admin))];

        const newGroup = new Group({
            name: name.trim(),
            description: description || '',
            admin,
            members: [admin, ...uniqueMembers]
        });

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { folder: 'group_images' });
            newGroup.groupImage = result.secure_url;
        }

        await newGroup.save();

        const populated = await Group.findById(newGroup._id)
            .populate('admin', 'username profilePhoto')
            .populate('members', 'username profilePhoto isOnline');

        return res.status(201).json(populated);
    } catch (err) {
        console.error('Group create error:', err);
        return res.status(500).json({ message: 'Failed to create group', error: err.message });
    }
};


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
        console.error('Get group details error:', err);
        res.status(500).json({message:"Internal Server Error"});
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

const searchUserGroups = async (req, res) => {
    try {
        const userId = req.user.userId;
        const query = (req.query.q || req.body.query || '').trim();
        if (!query) {
            return res.status(200).json({ groups: [] });
        }
        const regex = new RegExp(query, 'i');
        const groups = await Group.find({
            members: userId,
            $or: [
                { name: regex },
                { description: regex }
            ]
        })
        .limit(25)
        .populate('admin', 'username profilePhoto')
        .populate('members', 'username profilePhoto isOnline')
        .populate('lastMessage');
        return res.status(200).json({ groups });
    } catch (err) {
        console.error('Search user groups error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports={creategroup,getGroupdetails,updategroup,addmemberstogroup,deleteMembersFromGroup,getgroupmessages,searchUserGroups};