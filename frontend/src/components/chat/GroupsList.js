import React from 'react';
import { FiUsers } from 'react-icons/fi';

const GroupsList = ({ activeTab, searchQuery, groupSearchResults, groups, selectGroup, selectedGroup, unreadMessages }) => {
  if (activeTab !== 'groups') return null;
  const list = (searchQuery ? groupSearchResults : groups);
  return (
    <>
      {list.length > 0 ? (
        list.map(group => {
          const unreadCount = unreadMessages.get(group._id) || 0;
          return (
            <div
              key={group._id}
              onClick={() => selectGroup(group)}
              className={`flex items-center space-x-3 p-4 cursor-pointer transition border-b border-gray-100 ${
                selectedGroup?._id === group._id ? 'bg-blue-50 border-r-4 border-r-blue-500' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <FiUsers className="text-white" size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>{group.name}</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{group.members?.length || 0} members</p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="p-4 text-center text-gray-500">
          <FiUsers size={48} className="mx-auto mb-4 text-gray-300" />
          {searchQuery ? (
            <>
              <p>No matching groups</p>
              <p className="text-sm">Try a different keyword</p>
            </>
          ) : (
            <>
              <p>No groups yet</p>
              <p className="text-sm">Create a group to get started</p>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default GroupsList;
