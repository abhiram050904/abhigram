import React from 'react';
import { FiZap, FiUser, FiUsers, FiSettings, FiArrowLeft } from 'react-icons/fi';

const ChatHeader = ({ selectedUser, selectedGroup, chatHeader, onlineUsers, setShowGroupManagement, onBackMobile }) => {
  return (
    <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between backdrop-blur-md bg-white/95 sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <button onClick={onBackMobile} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition" aria-label="Back">
          <FiArrowLeft size={20} />
        </button>
        <div className="relative group">
          {selectedUser?._id === 'ai-assistant' ? (
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <FiZap className="text-white" size={20} />
            </div>
          ) : chatHeader?.avatar ? (
            <img
              src={chatHeader.avatar}
              alt={chatHeader.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-100 group-hover:ring-indigo-300 transition-all duration-300"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {selectedGroup ? <FiUsers size={20} /> : <FiUser size={20} />}
            </div>
          )}
          {((selectedUser?._id === 'ai-assistant') || (selectedUser && onlineUsers.includes(selectedUser._id))) && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{chatHeader?.name}</h3>
          <p className="text-sm text-gray-500 flex items-center">
            {selectedUser?._id === 'ai-assistant' && (
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            )}
            {chatHeader?.status}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {selectedGroup && (
          <button
            onClick={() => setShowGroupManagement(true)}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 group"
            title="Settings"
          >
            <FiSettings size={20} className="text-gray-600 group-hover:text-indigo-600 group-hover:rotate-90 transition-all duration-300" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
