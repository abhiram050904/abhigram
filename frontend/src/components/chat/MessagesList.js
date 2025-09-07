import React from 'react';
import { FiPaperclip } from 'react-icons/fi';

// Slightly increase base font size for messages (was text-sm, now text-[0.95rem])
const MessagesList = ({ messages, currentUser, selectedGroup, formatTime, userTyping, isLoadingMessages, messagesContainerRef, messagesEndRef, setSelectedMessage, setShowMessageOptions }) => {
  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-brand-50 via-white to-accent-50 relative chat-scrollbar">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-300 rounded-full" />
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-300 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-pink-300 rounded-full" />
      </div>
      <>
        {messages.map((message, index) => (
          <div
            key={message._id || index}
            className={`flex ${message.sender._id === currentUser._id ? 'justify-end' : 'justify-start'}`}
          >
            <div className="relative group animate-message-fade-in">
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl transform transition-all duration-300 hover:scale-[1.02] shadow-soft ${
                  message.sender._id === currentUser._id
                    ? 'bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white hover:shadow-elevated'
                    : message.sender.username === 'AI Assistant'
                    ? 'bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 text-white hover:shadow-elevated'
                    : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-gray-200 hover:shadow-md'
                }`}
                style={{ fontSize: '0.95rem', lineHeight: '1.35rem' }}
              >
                {selectedGroup && message.sender._id !== currentUser._id && (
                  <p className="text-xs font-medium mb-1 opacity-75">
                    {message.sender.username}
                  </p>
                )}
                {message.messageType === 'image' ? (
                  <img
                    src={message.content}
                    alt="Shared image"
                    className="rounded-lg max-w-full h-auto"
                    onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                  />
                ) : message.messageType === 'video' ? (
                  <video src={message.content} controls className="rounded-lg max-w-full h-auto" style={{ maxHeight: '300px' }} />
                ) : message.messageType === 'audio' ? (
                  <audio src={message.content} controls className="w-full" />
                ) : (message.messageType === 'document' || message.messageType === 'file') ? (
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <FiPaperclip className="text-gray-500" size={16} />
                      <a
                        href={message.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 underline text-sm"
                      >
                        📎 Open File
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap" style={{ fontSize: '0.95rem' }}>{message.content}</p>
                )}
                <p className={`text-xs mt-1 ${
                  message.sender._id === currentUser._id || message.sender.username === 'AI Assistant'
                    ? 'text-blue-100'
                    : 'text-gray-500'
                }`}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
              {message.sender._id === currentUser._id && (
                <button
                  onClick={() => { setSelectedMessage(message); setShowMessageOptions(true); }}
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-full p-2 transition-all duration-300 hover:scale-110 shadow-lg"
                >
                  •••
                </button>
              )}
            </div>
          </div>
        ))}
        {userTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 px-4 py-3 rounded-2xl shadow-md">
              <p className="text-sm italic flex items-center space-x-2">
                <span className="animate-typing-dots">●</span>
                <span>{userTyping} is typing...</span>
              </p>
            </div>
          </div>
        )}
      </>
      {isLoadingMessages && (
        <div className="absolute inset-0 backdrop-blur-sm bg-white/40 flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="animate-spin text-indigo-600 mb-2">⏳</div>
            <p className="text-sm text-gray-700 font-medium">Loading messages...</p>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesList;
