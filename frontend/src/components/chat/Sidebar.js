import React from 'react';
import logo from '../../logo.png';
import { FiPlus, FiLogOut, FiSearch, FiLoader, FiUser, FiUsers } from 'react-icons/fi';
import AIChatEntry from './AIChatEntry';
import RecentChatsList from './RecentChatsList';
import SearchResultsList from './SearchResultsList';
import GroupsList from './GroupsList';

const Sidebar = ({ currentUser, setShowProfileModal, setShowGroupModal, logout, activeTab, setActiveTab, searchQuery, setSearchQuery, handleSearchChange, handleSearchKeyDown, executeUserSearch, isLoadingUsers, isSearching, searchResults, chatSearchDisplay, recentChats, selectUser, selectedUser, unreadMessages, formatTime, isLoadingRecentChats, groupSearchResults, groups, selectGroup, selectedGroup, unreadMessagesMap, onlineUsers, aiUser, isMobileVisible, onCloseMobile }) => {
  return (
    <div className={`bg-white/90 backdrop-blur-sm border-r border-emerald-100 flex flex-col shadow-soft w-full md:w-1/3 md:static md:translate-x-0 h-full z-30 md:z-auto transition-transform duration-300 ${isMobileVisible ? 'fixed inset-0 translate-x-0' : 'fixed -translate-x-full inset-y-0 -left-full'} md:flex`}>        
      <div className="p-4 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white relative overflow-hidden font-display">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full animate-bounce" />
          <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-white rounded-full animate-ping" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="App Logo" className="w-10 h-10 rounded-xl shadow-md ring-2 ring-white/40 hover:scale-105 transition-transform" />
          </div>
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setShowProfileModal(true)}>
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/30 group-hover:ring-white/60 transition-all duration-300 group-hover:scale-105">
                {currentUser?.profilePhoto ? (
                  <img src={currentUser.profilePhoto} alt={currentUser.username} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="font-bold text-lg">{currentUser?.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-lg group-hover:text-emerald-200 transition-colors">{currentUser?.username}</h2>
              <p className="text-sm text-emerald-100 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button onClick={() => setShowGroupModal(true)} className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110 backdrop-blur-sm" title="Create Group">
              <FiPlus size={20} />
            </button>
            <button onClick={logout} className="p-3 hover:bg-red-500/20 rounded-xl transition-all duration-300 hover:scale-110 backdrop-blur-sm" title="Logout">
              <FiLogOut size={20} />
            </button>
            <button onClick={onCloseMobile} className="p-3 md:hidden hover:bg-white/20 rounded-xl transition-all" title="Close">
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="flex bg-gradient-to-r from-white/60 to-white/30 border-b border-emerald-100 relative backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-teal-50/50" />
        <button
          onClick={() => setActiveTab('chats')}
          className={`relative flex-1 py-4 px-6 text-center transition-all duration-300 font-medium ${
            activeTab === 'chats' ? 'text-emerald-600 bg-white shadow-lg transform scale-105 z-10' : 'text-gray-600 hover:text-emerald-500 hover:bg-white/70'
          }`}
          style={{ borderRadius: activeTab === 'chats' ? '12px 12px 0 0' : '0', marginBottom: activeTab === 'chats' ? '-1px' : '0' }}
        >
          <FiUser className="inline mr-2" size={18} />
          Chats
          {activeTab === 'chats' && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`relative flex-1 py-4 px-6 text-center transition-all duration-300 font-medium ${
            activeTab === 'groups' ? 'text-emerald-600 bg-white shadow-lg transform scale-105 z-10' : 'text-gray-600 hover:text-emerald-500 hover:bg-white/70'
          }`}
          style={{ borderRadius: activeTab === 'groups' ? '12px 12px 0 0' : '0', marginBottom: activeTab === 'groups' ? '-1px' : '0' }}
        >
          <FiUsers className="inline mr-2" size={18} />
          Groups
          {activeTab === 'groups' && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-full" />}
        </button>
      </div>

      <div className="p-4 bg-gradient-to-r from-white/70 to-white/40 border-b border-emerald-100 backdrop-blur-md">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
          <button
            type="button"
            onClick={() => { if (activeTab === 'chats') executeUserSearch(searchQuery); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
            title="Search"
          >
            <FiSearch size={18} />
          </button>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-12 pr-12 py-3 bg-gray-100 hover:bg-white rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all duration-300 placeholder-gray-500"
          />
          {(isLoadingUsers || isSearching) && (
            <FiLoader className="absolute right-4 top-1/2 transform -translate-y-1/2 animate-spin text-emerald-500" size={18} />
          )}
          {!isLoadingUsers && !isSearching && searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' && (
          <>
            <AIChatEntry selectedUser={selectedUser} selectUser={selectUser} aiUser={aiUser} />
            <RecentChatsList
              isLoadingRecentChats={isLoadingRecentChats}
              recentChats={recentChats}
              selectUser={selectUser}
              selectedUser={selectedUser}
              unreadMessages={unreadMessages}
              formatTime={formatTime}
            />
            <SearchResultsList
              searchQuery={searchQuery}
              activeTab={activeTab}
              chatSearchDisplay={chatSearchDisplay}
              isSearching={isSearching}
              unreadMessages={unreadMessages}
              selectedUser={selectedUser}
              selectUser={selectUser}
              onlineUsers={onlineUsers}
            />
            {!searchQuery && recentChats.filter(chat => chat.email !== 'ai@abhigram.com' && chat.email !== 'aisystem@gmail.com').length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <FiUser size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No recent chats</p>
                <p className="text-sm">Search for users to start chatting</p>
              </div>
            )}
          </>
        )}
        <GroupsList
          activeTab={activeTab}
            searchQuery={searchQuery}
          groupSearchResults={groupSearchResults}
          groups={groups}
          selectGroup={selectGroup}
          selectedGroup={selectedGroup}
          unreadMessages={unreadMessages}
        />
      </div>
    </div>
  );
};

export default Sidebar;
