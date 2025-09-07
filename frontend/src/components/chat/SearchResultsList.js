import React from 'react';
import { FiUser } from 'react-icons/fi';

const SearchResultsList = ({ searchQuery, activeTab, chatSearchDisplay, isSearching, unreadMessages, selectedUser, selectUser, onlineUsers }) => {
  if (!searchQuery || activeTab !== 'chats') return null;
  return (
    <div className="px-4 py-2 border-t border-gray-200 font-display">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Search Results</h4>
      {chatSearchDisplay.length > 0 ? (
        chatSearchDisplay.map(user => {
          const unreadCount = unreadMessages.get(user._id) || 0;
          return (
            <div
              key={user._id}
              onClick={() => selectUser(user)}
              className={`flex items-center space-x-3 p-3 mb-1 rounded-lg cursor-pointer transition ${
                selectedUser?._id === user._id ? 'bg-blue-50 border-r-4 border-r-blue-500' : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <FiUser className="text-gray-600" size={16} />
                  </div>
                )}
                {onlineUsers.includes(user._id) && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>{user.username}</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{onlineUsers.includes(user._id) ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          );
        })
      ) : (
        !isSearching && (
          <div className="text-center text-gray-500 py-4 text-sm">
            {searchQuery.length <= 1 ? 'Type at least 2 characters for global search.' : 'No users found.'}
          </div>
        )
      )}
    </div>
  );
};

export default SearchResultsList;
