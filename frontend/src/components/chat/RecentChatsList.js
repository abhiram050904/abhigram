import React from 'react';
import { FiUser } from 'react-icons/fi';

const RecentChatsList = ({ isLoadingRecentChats, recentChats, selectUser, selectedUser, unreadMessages, formatTime }) => {
  if (isLoadingRecentChats) {
    return (
      <div className="px-4 py-2 border-t border-gray-200 font-display">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Chats</h4>
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center space-x-3 p-4 mb-2 rounded-xl animate-shimmer">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const chats = recentChats.filter(chat => chat.email !== 'ai@abhigram.com' && chat.email !== 'aisystem@gmail.com');
  if (chats.length === 0) return null;

  return (
    <div className="px-4 py-2 border-t border-gray-200 font-display tracking-wide">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Chats</h4>
      {chats.map(chat => {
        const unreadCount = unreadMessages.get(chat._id) || 0;
        return (
          <div
            key={chat._id}
            onClick={() => selectUser(chat)}
            className={`flex items-center space-x-3 p-4 mb-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md ${
              selectedUser?._id === chat._id
                ? 'bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-l-4 border-l-emerald-500 shadow-lg'
                : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-md'
            }`}
          >
            <div className="relative">
              {chat.profilePhoto ? (
                <img src={chat.profilePhoto} alt={chat.username} className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-lg transition-transform duration-300 hover:scale-110" />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg transition-transform duration-300 hover:scale-110">
                  <FiUser className="text-white" size={18} />
                </div>
              )}
              {chat.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`truncate ${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>{chat.username}</h3>
                {unreadCount > 0 && (
                  <span className="bg-emerald-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </div>
              <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>
                {chat.lastMessage?.messageType === 'image' ? '📷 Image' :
                 chat.lastMessage?.messageType === 'video' ? '📹 Video' :
                 chat.lastMessage?.messageType === 'audio' ? '🎵 Audio' :
                 chat.lastMessage?.messageType === 'document' ? '📄 Document' :
                 chat.lastMessage?.messageType === 'file' ? '📎 File' :
                 chat.lastMessage?.content || 'No messages yet'}
              </p>
            </div>
            <div className="text-xs text-gray-400">{chat.lastMessage && formatTime(chat.lastMessage.createdAt)}</div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentChatsList;
