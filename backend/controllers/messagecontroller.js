const Message = require("../models/messagemodel");
const cloudinary = require('cloudinary').v2;


const { GoogleGenerativeAI } = require("@google/generative-ai");


const sendmessage=async(req,res)=>{
    try{

        const {recieverId,content,messageType}=req.body;
        const senderId=req.user.userId;


        let messageData={sender:senderId,receiver:recieverId,content,messageType};

        if(messageType==='image' && req.file){
            const result=await cloudinary.uploader.upload(req.file.path);
            messageData.content=result.secure_url;
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

        await message.remove();
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
You are a friendly AI companion. 
Your role is to chat casually with the user, like a supportive and kind friend. 
- Always respond in a warm, approachable, and natural tone. 
- Ask follow-up questions sometimes to keep the conversation flowing. 
- Provide clear and helpful answers to the user’s questions, whether they are personal, technical, or general knowledge. 
- If the user is feeling down or stressed, respond with empathy and encouragement. 
- Keep responses concise and easy to read, but engaging. 
- Avoid sounding too robotic or overly formal — keep it natural, like talking to a close friend.
`;



const sendAIMessage=async(req,res)=>{
    try{

        const senderId=req.user.userId;
        const {content}=req.body;

        const aiuser=await User.findOne({email:"aisystem@gmail.com"});

        if(!aiuser){
            aiuser=new User({username:"AI System",email:"aisystem@gmail.com",password:"securepassword"});
            await aiuser.save();
        }

        const usermessage=new Message({sender:senderId,receiver:aiuser._id,content,messageType:'text' });
        await usermessage.save();

         const result = await model.generateContent([
        { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "user", parts: [{ text: content }] },
     ]);

        const aiResponse = result.response.text();

        const aimessage=new Message({sender:aiuser._id,receiver:senderId,content:aiResponse,messageType:'text' });
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

module.exports={sendmessage,getmessages,markAsRead,deletemessage,sendAIMessage};