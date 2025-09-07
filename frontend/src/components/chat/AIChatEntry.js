import React from 'react';
import { FiZap } from 'react-icons/fi';

const AIChatEntry = ({ selectedUser, selectUser, aiUser }) => {
  return (
    <div className="px-4 py-3">
      <div
        onClick={() => selectUser(aiUser)}
        className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] group ${
          selectedUser?._id === 'ai-assistant'
            ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-xl'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200'
        }`}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-white rounded-full transform -translate-x-6 translate-y-6 group-hover:scale-125 transition-transform duration-700"></div>
        </div>

        <div className="relative z-10 flex items-center space-x-4 p-4">
          <div className="relative">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 ${
                selectedUser?._id === 'ai-assistant' ? 'bg-white/20 backdrop-blur-sm' : 'bg-gradient-to-br from-green-500 to-emerald-500'
              }`}
            >
              <FiZap className="text-white" size={20} />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
          </div>
          <div className="flex-1">
            <h3
              className={`font-bold text-lg group-hover:scale-105 transition-transform origin-left ${
                selectedUser?._id === 'ai-assistant' ? 'text-white' : 'text-gray-900'
              }`}
            >
              AI Assistant
            </h3>
            <p
              className={`text-sm flex items-center ${
                selectedUser?._id === 'ai-assistant' ? 'text-emerald-100' : 'text-emerald-600'
              }`}
            >
              <span className="mr-2">🚀</span>
              Always ready to help
            </p>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="text-xs font-medium">AI</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatEntry;
