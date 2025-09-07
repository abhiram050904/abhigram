import React, { useState, useRef } from 'react';
import { FiSmile } from 'react-icons/fi';
import EmojiPicker from './EmojiPicker';

const EmojiButton = ({ onEmojiSelect, className = "" }) => {
    const [showPicker, setShowPicker] = useState(false);
    const buttonRef = useRef(null);

    const handleEmojiSelect = (emoji) => {
        onEmojiSelect(emoji);
        setShowPicker(false);
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
                title="Add emoji"
            >
                <FiSmile size={20} />
            </button>
            
            {showPicker && (
                <EmojiPicker 
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowPicker(false)}
                    buttonRef={buttonRef}
                    isOpen={showPicker}
                />
            )}
        </div>
    );
};

export default EmojiButton;