const express=require('express');
const cors=require('cors');
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
const dotenv=require('dotenv');
const cloudinary = require('cloudinary').v2;
const socketIo = require('socket.io');
const http = require('http');

dotenv.config();

const app=express();
const server = http.createServer(app);

const PORT=process.env.PORT || 5000;
const MONGO_URI=process.env.MONGO_URI;

//routes
const authRoutes=require('./routes/userroutes')
const messageRoutes=require('./routes/messageroutes')
const groupRoutes=require('./routes/grouproutes')
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use('/api/auth',authRoutes);
app.use('/api/messages',messageRoutes);
app.use('api/groups',groupRoutes);

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const connectCloudinary = async () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
  });
  console.log('Cloudinary configured');
};


// Initialize Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});



// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});


// Store active users and their socket IDs

const activeUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId



io.on('connection', async (socket) => {
    const userId = socket.userId;
    
    try {
        // Update user's online status in database
        await User.findByIdAndUpdate(userId, { 
            isOnline: true,
            lastSeen: new Date()
        });

        // Store user's socket information
        activeUsers.set(userId, socket.id);
        userSockets.set(socket.id, userId);

        // Broadcast user's online status to all connected users
        io.emit('user_status_change', {
            userId: userId,
            status: 'online'
        });

        // Join all user's groups
        const userGroups = await Group.find({ members: userId });
        userGroups.forEach(group => {
            socket.join(`group:${group._id}`);
        });

        // Handle private messages
        socket.on('private_message', async (data) => {
            try {
                const { receiverId, content, type = 'text' } = data;
                const senderId = userId;

                // Save message to database
                const message = new Message({
                    sender: senderId,
                    receiver: receiverId,
                    content,
                    messageType: type
                });
                await message.save();

                // Populate sender information
                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'username profilePhoto')
                    .populate('receiver', 'username profilePhoto');

                // Send to receiver if online
                const receiverSocketId = activeUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('new_message', populatedMessage);
                }

                // Send confirmation to sender
                socket.emit('message_sent', populatedMessage);
            } catch (error) {
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Handle typing status
        socket.on('typing_status', (data) => {
            const receiverSocketId = activeUsers.get(data.receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing_status', {
                    userId: userId,
                    isTyping: data.isTyping
                });
            }
        });

        // Handle message read status
        socket.on('message_read', async (data) => {
            try {
                const { messageId } = data;
                const message = await Message.findById(messageId);

                if (!message) {
                    return;
                }

                if (message.isGroupMessage) {
                    // Add user to read array if not already present
                    await Message.findOneAndUpdate(
                        { 
                            _id: messageId,
                            'read.user': { $ne: userId }
                        },
                        {
                            $push: { read: { user: userId, readAt: new Date() } }
                        }
                    );

                    // Broadcast read status to group
                    io.to(`group:${message.group}`).emit('group_message_read', {
                        messageId,
                        userId,
                        groupId: message.group
                    });
                } else {
                    // Handle private message read status
                    await Message.findByIdAndUpdate(messageId, { read: true });
                    
                    const senderSocketId = activeUsers.get(message.sender.toString());
                    if (senderSocketId) {
                        io.to(senderSocketId).emit('message_status_update', {
                            messageId,
                            status: 'read'
                        });
                    }
                }
            } catch (error) {
                console.error('Error updating message read status:', error);
            }
        });

        // Handle group messages
        socket.on('group_message', async (data) => {
            try {
                const { groupId, content, type = 'text' } = data;
                
                // Create and save group message
                const message = new Message({
                    sender: userId,
                    group: groupId,
                    content,
                    messageType: type,
                    isGroupMessage: true,
                    read: [{ user: userId }] // Mark as read by sender
                });
                await message.save();

                // Update group's last message
                await Group.findByIdAndUpdate(groupId, { lastMessage: message._id });

                // Populate message with sender info
                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'username profilePhoto')
                    .populate('read.user', 'username');

                // Broadcast message to all group members
                io.to(`group:${groupId}`).emit('new_group_message', populatedMessage);

            } catch (error) {
                socket.emit('message_error', { error: 'Failed to send group message' });
            }
        });

        // Handle joining group
        socket.on('join_group', async (groupId) => {
            socket.join(`group:${groupId}`);
        });

        // Handle leaving group
        socket.on('leave_group', async (groupId) => {
            socket.leave(`group:${groupId}`);
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            try {
                // Update user's online status and last seen
                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen: new Date()
                });

                // Remove user from active users
                activeUsers.delete(userId);
                userSockets.delete(socket.id);

                // Broadcast user's offline status
                io.emit('user_status_change', {
                    userId: userId,
                    status: 'offline',
                    lastSeen: new Date()
                });
            } catch (error) {
                console.error('Error handling disconnection:', error);
            }
        });

    } catch (error) {
        console.error('Socket connection error:', error);
        socket.disconnect(true);
    }
});



server.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    connectCloudinary();
});



