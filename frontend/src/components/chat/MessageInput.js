import React from 'react';
import { FiImage, FiPaperclip, FiLoader, FiSend, FiTrash2 } from 'react-icons/fi';
import EmojiButton from '../EmojiButton';

const MessageInput = ({ selectedFile, setSelectedFile, selectedGroup, chatHeader, newMessage, setNewMessage, handleTyping, handleKeyPress, isSendingMessage, sendMessage, fileInputRef, handleFileSelect, getFileType }) => {
  return (
    <div className="p-6 bg-gradient-to-r from-white/90 via-brand-50 to-accent-50 border-t border-gray-200 backdrop-blur-sm">
      {selectedFile && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-between shadow-lg border border-blue-200 animate-slide-in-left">
          <div className="flex items-center space-x-3">
            {selectedFile.type.startsWith('image/') ? (
              <FiImage className="text-blue-600" size={20} />
            ) : selectedFile.type.startsWith('video/') ? (
              <div className="text-blue-600 text-lg font-bold">📹</div>
            ) : selectedFile.type.startsWith('audio/') ? (
              <div className="text-blue-600 text-lg font-bold">🎵</div>
            ) : (
              <FiPaperclip className="text-blue-600" size={20} />
            )}
            <div>
              <span className="text-sm text-gray-800 font-medium truncate max-w-xs block">{selectedFile.name}</span>
              <span className="text-xs text-blue-600 font-semibold">{(selectedFile.size / 1024 / 1024).toFixed(1)}MB</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-red-500 hover:text-red-700 transition-all duration-300 transform hover:scale-110 p-2 rounded-full hover:bg-red-50"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      )}
      <div className="flex items-end space-x-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 hover:bg-gradient-to-r hover:from-gray-100 hover:to-blue-100 rounded-xl transition-all duration-300 transform hover:scale-110 interactive-button"
          disabled={isSendingMessage}
        >
          <FiPaperclip size={20} className="text-gray-600" />
        </button>
        <EmojiButton onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex-1">
          <textarea
            placeholder={`Message ${chatHeader?.name}...`}
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
            onKeyPress={handleKeyPress}
            className="w-full px-5 py-3 bg-white/70 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none transition-all duration-300 hover:shadow-soft"
            rows="1"
            style={{ minHeight: '44px', maxHeight: '120px', fontSize: '0.95rem' }}
            disabled={isSendingMessage}
          />
        </div>
        <button
          onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || isSendingMessage}
          className="p-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-xl hover:from-brand-600 hover:to-accent-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 shadow-soft hover:shadow-elevated interactive-button"
        >
          {isSendingMessage ? <FiLoader className="animate-spin" size={20} /> : <FiSend size={20} />}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
