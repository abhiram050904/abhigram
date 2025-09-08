const Message = require("../models/messagemodel");
const User = require("../models/usermodel");
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const AIUsage = require('../models/aiusagemodel');


const { GoogleGenerativeAI } = require("@google/generative-ai");


const sendmessage=async(req,res)=>{
    try{

        const {recieverId,content,messageType}=req.body;
        const senderId=req.user.userId;

        let messageContent = content || '';
        let messageData={sender:senderId,receiver:recieverId,content:messageContent,messageType};

        if(messageType !== 'text' && req.file){
            // Map messageType to Cloudinary resource types
            let resource_type = 'auto';
            if (messageType === 'image') resource_type = 'image';
            else if (messageType === 'video') resource_type = 'video';
            else if (messageType === 'audio' || messageType === 'document' || messageType === 'file') resource_type = 'raw';
            const result=await cloudinary.uploader.upload(req.file.path, { resource_type });
            messageData.content=result.secure_url;
        } else if (messageType === 'text' && !messageContent.trim()) {
            return res.status(400).json({message: "Text message cannot be empty"});
        }
        const message=new Message(messageData);
        await message.save();

        //populate sender and receiver details
        const populatedMessage=await Message.findById(message._id)
        .populate('sender','username profilePhoto')
        .populate('receiver','username profilePhoto');

        res.status(200).json({message:populatedMessage});
    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}


const getmessages=async(req,res)=>{
    try{

        const {userId}=req.params;
        const myId=req.user.userId;

        const messages=await Message.find({
            $or:[
                {sender:myId,receiver:userId},
                {sender:userId,receiver:myId}
            ]
        }).sort({createdAt:1})
          .populate('sender','username profilePhoto')
          .populate('receiver','username profilePhoto');

        res.status(200).json({messages});

    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}


const markAsRead=async(req,res)=>{
    try{

        const {messageId}=req.params;

        await  Message.updateMany({_id:{$in:messageId}},
            {reciever:req.user.userId},
            { $set: { read: true } }
        ); 

        res.status(200).json({message:"Messages marked as read"});

    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}


const deletemessage=async(req,res)=>{
    try{

        const {messageId}=req.params;
        const message=await Message.findById(messageId);

        if(!message){
            return res.status(404).json({message:"Message not found"});
        }

        //check if authorized to delete
        if(message.sender.toString()!==req.user.userId){
            return res.status(403).json({message:"Unauthorized"});
        }

        if (message.messageType === 'image') {
            const publicId = message.content.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        
        await message.deleteOne();
        res.status(200).json({message:"Message deleted successfully"});

    }
    catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}


const geminiclient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = geminiclient.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_PROMPT = `
You are a friendly and emotionally supportive AI companion. 
Your role is to chat casually with the user while also being a source of comfort and encouragement.

Guidelines:
- Always respond in a warm, caring, and empathetic tone — like a close and supportive friend. 
- If the user seems sad, stressed, or discouraged, acknowledge their feelings and provide kind, uplifting, and emotionally supportive responses. 
- Celebrate the user’s joys and encourage them during challenges. 
- Keep the conversation light, natural, and friendly — avoid sounding robotic or overly formal. 
- Ask gentle follow-up questions to show genuine interest and keep the conversation flowing. 
- Provide clear and helpful answers to questions, but always balance them with empathy and encouragement. 
- Use positive and reassuring language. Add a touch of friendliness, compassion, and optimism wherever possible.
`;



const sendAIMessage=async(req,res)=>{
    try{

    const senderId=req.user.userId;
    const {content,messageType}=req.body;

        let aiuser = await User.findOne({email:"aisystem@gmail.com"});

        if(!aiuser){
            aiuser = new User({username:"AI Assistant",email:"aisystem@gmail.com",password:"securepassword"});
            await aiuser.save();
        }

        // Determine message type & rate limiting BEFORE heavy processing
        let messageContent = content || '';
        let userMessageType = messageType || (req.file ? 'image' : 'text');

        if (userMessageType === 'text' && !messageContent.trim() && !req.file) {
            return res.status(400).json({message: "Text message cannot be empty"});
        }

        // Date key (UTC) for usage tracking
        const today = new Date().toISOString().slice(0,10);
        let usage = await AIUsage.findOne({ user: senderId, date: today });
        if (!usage) {
            usage = new AIUsage({ user: senderId, date: today, messageCount: 0, imageCount: 0 });
        }

        // Enforce limits
        if (usage.messageCount >= 10) {
            // Delete temp file if present (multer stored it)
            if (req.file) {
                try { fs.unlinkSync(req.file.path); } catch(e) {}
            }
            return res.status(429).json({ message: "Daily AI message limit reached (10 per day). Try again tomorrow." });
        }
        if (userMessageType === 'image' && usage.imageCount >= 2) {
            if (req.file) {
                try { fs.unlinkSync(req.file.path); } catch(e) {}
            }
            return res.status(429).json({ message: "Daily AI image analysis limit reached (2 images per day). Try again tomorrow." });
        }

        // Proceed with upload if non-text media
        if (userMessageType !== 'text' && req.file) {
            let resource_type = 'auto';
            if (userMessageType === 'image') resource_type = 'image';
            else if (userMessageType === 'video') resource_type = 'video';
            else if (userMessageType === 'audio' || userMessageType === 'document' || userMessageType === 'file') resource_type = 'raw';
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type });
            messageContent = result.secure_url;
        }

        // Increment usage counters (consume quota regardless of later AI errors)
        usage.messageCount += 1;
        if (userMessageType === 'image') usage.imageCount += 1;
        await usage.save();

        const usermessage=new Message({
            sender:senderId,
            receiver:aiuser._id,
            content:messageContent,
            messageType:userMessageType
        });
        await usermessage.save();

        // Generate AI response based on message type
        let aiResponseContent;
        if (userMessageType === 'text') {
            try {
                const result = await model.generateContent([
                    SYSTEM_PROMPT + "\n\nUser: " + messageContent
                ]);
                aiResponseContent = result.response.text();
            } catch (err) {
                console.error('AI text generation error:', err);
                aiResponseContent = "I'm sorry, I had trouble generating a response just now. Could you try again?";
            }
        } else if (userMessageType === 'image' && req.file) {
            // Perform OCR / vision analysis with Gemini on the uploaded image
            try {
                const imageBuffer = fs.readFileSync(req.file.path);
                const base64Data = imageBuffer.toString('base64');
                const visionPrompt = `You are an OCR & vision assistant.
Task:
1. Extract ALL readable text from the image. Preserve line breaks.
2. Provide a concise one-paragraph summary of the image content (max 60 words).
3. List key entities (names, brands, numbers, dates) if present.

Return in this plain text structure:
Extracted Text:\n<exact text or 'None'>\n\nSummary:\n<summary>\n\nEntities:\n<comma separated or 'None'>`;

                const result = await model.generateContent([
                    { text: visionPrompt },
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: req.file.mimetype || 'image/*'
                        }
                    }
                ]);
                const visionText = result.response.text();
                aiResponseContent = `Here's what I found from your image:\n\n${visionText}`;
            } catch (err) {
                console.error('AI vision (OCR) error:', err);
                aiResponseContent = "I received your image but couldn't process its text right now. You can describe it to me, or try sending another image.";
            }
        } else {
            // For other non-text message types (video, audio, document, file)
            const typeLabel = userMessageType;
            aiResponseContent = `I see you've shared a ${typeLabel}. If you have any specific questions about it, feel free to describe what you'd like to know!`;
        }

        // Append usage info to AI response for transparency
        try {
            aiResponseContent += `\n\n(Usage today: ${usage.messageCount}/10 messages, ${usage.imageCount}/2 images)`;
        } catch(e) {}

        const aimessage=new Message({
            sender:aiuser._id,
            receiver:senderId,
            content:aiResponseContent,
            messageType:'text'
        });
        await aimessage.save();


    const populatedMessage=await Message.find({_id:{$in:[usermessage._id,aimessage._id]}})
        .populate('sender','username profilePhoto')
        .populate('receiver','username profilePhoto');
        
        
        res.status(200).json({messages:populatedMessage});

    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}

const sendGroupMessage=async(req,res)=>{
    try{
        const {groupId,content,messageType}=req.body;
        const senderId=req.user.userId;

        let messageContent = content || ''; // Default to empty string
        let messageData={
            sender:senderId,
            group:groupId,
            content:messageContent,
            messageType,
            isGroupMessage:true,
            read:[{user:senderId}] // Mark as read by sender
        };

        if(messageType !== 'text' && req.file){
            let resource_type = 'auto';
            if (messageType === 'image') resource_type = 'image';
            else if (messageType === 'video') resource_type = 'video';
            else if (messageType === 'audio' || messageType === 'document' || messageType === 'file') resource_type = 'raw';
            const result=await cloudinary.uploader.upload(req.file.path, { resource_type });
            messageData.content=result.secure_url;
        } else if (messageType === 'text' && !messageContent.trim()) {
            return res.status(400).json({message: "Text message cannot be empty"});
        }

        const message=new Message(messageData);
        await message.save();

        // Update group's last message
        const Group = require('../models/groupmodel');
        await Group.findByIdAndUpdate(groupId, { lastMessage: message._id });

        //populate sender details
        const populatedMessage=await Message.findById(message._id)
        .populate('sender','username profilePhoto')
        .populate('read.user','username');

        res.status(200).json({message:populatedMessage});
    }
    catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}

module.exports={sendmessage,getmessages,markAsRead,deletemessage,sendAIMessage,sendGroupMessage};