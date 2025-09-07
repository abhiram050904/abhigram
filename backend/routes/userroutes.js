const express=require('express');
const { register, login, getProfile, updateProfile, searchUsers, getOnlineUsers, getRecentChats, getUserGroups } = require('../controllers/usercontroller');
const upload=require('../middleware/multer');
const authMiddleware = require('../middleware/auth');
const router=express.Router();


router.post('/register',upload.single('profilePhoto'),register);
router.post('/login',login);
router.get('/profile/:userId',authMiddleware,getProfile);
router.put('/profile/:userId',authMiddleware,upload.single('profilePhoto'),updateProfile);
router.post('/search',authMiddleware,searchUsers);
router.get('/online-users',authMiddleware,getOnlineUsers);
router.get('/recent-chats',authMiddleware,getRecentChats);
router.get('/user-groups',authMiddleware,getUserGroups);

module.exports=router;