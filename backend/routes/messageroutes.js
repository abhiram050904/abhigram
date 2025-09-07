const express=require('express');
const upload = require('../middleware/multer');
const authMiddleware = require('../middleware/auth');
const { sendmessage, markAsRead, getmessages, deletemessage, sendAIMessage, sendGroupMessage } = require('../controllers/messagecontroller');
const router=express.Router();

router.post('/send',authMiddleware,upload.single('image'),sendmessage);
router.post('/send/group',authMiddleware,upload.single('image'),sendGroupMessage);
router.get('/chat/:userId',authMiddleware,getmessages);
router.post('/read/:messageId',authMiddleware,markAsRead);
router.delete('/:messageId',authMiddleware,deletemessage);
router.post('/ai/send',authMiddleware,upload.single('image'),sendAIMessage);
module.exports=router; 