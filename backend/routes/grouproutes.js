const express=require("express");
const authMiddleware = require("../middleware/auth");
const { creategroup, updategroup, getGroupdetails, addmemberstogroup, deleteMembersFromGroup, getgroupmessages } = require("../controllers/groupcontroller");
const upload = require("../middleware/multer");
const router=express.Router();

router.post('/create',authMiddleware,upload.single('image'),creategroup);
router.get('/:groupId',authMiddleware,getGroupdetails);
router.put('/update/:groupId',authMiddleware,upload.single('image'),updategroup);
router.post('/addMember/:groupId',authMiddleware,addmemberstogroup);
router.post('/removeMember/:groupId',authMiddleware,deleteMembersFromGroup);
router.get('/:groupId/messages',authMiddleware,getgroupmessages);

module.exports=router;