// Hardcoded backend URL (Render deployment)
export const BackendUrl = 'https://abhigram.onrender.com';
export const RegisterRoute = `${BackendUrl}/api/auth/register`;
export const LoginRoute = `${BackendUrl}/api/auth/login`;
// Profile endpoints expect /profile/:userId
export const GetProfileRoute = `${BackendUrl}/api/auth/profile`; // append /:userId where used
export const UpdateProfileRoute = `${BackendUrl}/api/auth/profile`; // append /:userId where used
export const SearchUsersRoute = `${BackendUrl}/api/auth/search`;
export const GetOnlineUsersRoute = `${BackendUrl}/api/auth/online-users`;
export const GetRecentChatsRoute = `${BackendUrl}/api/auth/recent-chats`;
export const GetUserGroupsRoute = `${BackendUrl}/api/auth/user-groups`;
export const SendMessageRoute = `${BackendUrl}/api/messages/send`;
export const GetMessagesRoute = `${BackendUrl}/api/messages/chat`;
export const MarkAsReadRoute = `${BackendUrl}/api/messages/read`;
export const DeleteMessageRoute = `${BackendUrl}/api/messages`;
export const SendAIMessageRoute = `${BackendUrl}/api/messages/ai/send`;
export const CreateGroupRoute = `${BackendUrl}/api/groups/create`;
export const GetGroupRoute = `${BackendUrl}/api/groups`;
export const UpdateGroupRoute = `${BackendUrl}/api/groups/update`;
// Group member modification endpoints expect /addMember/:groupId and /removeMember/:groupId
export const AddGroupMemberRoute = `${BackendUrl}/api/groups/addMember`; // append /:groupId
export const RemoveGroupMemberRoute = `${BackendUrl}/api/groups/removeMember`; // append /:groupId
export const GetGroupMessagesRoute = `${BackendUrl}/api/groups`; 
export const SearchGroupsRoute = `${BackendUrl}/api/groups/search/user`;