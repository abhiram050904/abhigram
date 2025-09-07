import React, { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PickerCore from 'emoji-picker-react';

/*
  Refactored Emoji Picker
  - Uses a React Portal so fixed positioning is not affected by parent stacking contexts/overflow.
  - Uses useLayoutEffect for immediate positioning (reduces flicker at 0,0).
  - Re-computes on: open state, resize, scroll (capture), orientation change.
  - Escape key closes picker.
  - Defensive timeouts to re-flow after fonts/layout settle.
  - Simplified positioning logic with collision handling and optional debug.
*/

const DEBUG = false; // set to true to log positioning details

const PICKER_DIMENSIONS = { width: 352, height: 430 }; // include borders
const PADDING_VIEWPORT = 8;

const CustomEmojiPicker = ({ onEmojiSelect, onClose, buttonRef, isOpen }) => {
    const pickerRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom', ready: false });

    // Ensure a portal root exists
    const portalRootRef = useRef(null);
    if (!portalRootRef.current && typeof document !== 'undefined') {
        let root = document.getElementById('emoji-portal-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'emoji-portal-root';
            document.body.appendChild(root);
        }
        portalRootRef.current = root;
    }

    const log = (...args) => { if (DEBUG) console.log('[EmojiPicker]', ...args); };

    const measure = useCallback(() => {
        const btn = buttonRef?.current;
        if (!btn || !pickerRef.current) return;
        const rect = btn.getBoundingClientRect();

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const W = PICKER_DIMENSIONS.width;
        const H = PICKER_DIMENSIONS.height;

        // Preferred placement: above if enough space else below
        const spaceAbove = rect.top;
        const spaceBelow = vh - rect.bottom;
        let placement = spaceBelow >= H || spaceBelow >= spaceAbove ? 'bottom' : 'top';

        let top = placement === 'bottom' ? rect.bottom + 6 : rect.top - H - 6;

        // If not enough space fully, clamp inside viewport
        if (top < PADDING_VIEWPORT) {
            top = Math.max(PADDING_VIEWPORT, Math.min(top, vh - H - PADDING_VIEWPORT));
        }

        // Try aligning right edge of picker with right edge of button
        let left = rect.right - W;

        // If that would overflow left, shift to button.left
        if (left < PADDING_VIEWPORT) left = rect.left;
        // Final clamp so it stays on-screen
        left = Math.max(PADDING_VIEWPORT, Math.min(left, vw - W - PADDING_VIEWPORT));

        setCoords(prev => {
            if (prev.top === top && prev.left === left && prev.placement === placement && prev.ready) return prev;
            log('Position set', { top, left, placement });
            return { top, left, placement, ready: true };
        });
    }, [buttonRef]);

    // Position calculation (layout effect for no flicker)
    React.useLayoutEffect(() => {
        if (!isOpen) return;
        measure();
        // Re-measure shortly after in case of scrollbars/font shifts
        const t1 = setTimeout(measure, 30);
        const t2 = setTimeout(measure, 120);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [isOpen, measure]);

    // Global listeners when open
    useEffect(() => {
        if (!isOpen) return;
        const handler = () => measure();
        window.addEventListener('resize', handler);
        window.addEventListener('scroll', handler, true);
        window.addEventListener('orientationchange', handler);
        return () => {
            window.removeEventListener('resize', handler);
            window.removeEventListener('scroll', handler, true);
            window.removeEventListener('orientationchange', handler);
        };
    }, [isOpen, measure]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const handleEmojiClick = (emojiData /*, event */) => {
        // Library v4 passes emojiData: {emoji, names, ...}
        const emoji = emojiData?.emoji || '';
        if (emoji) onEmojiSelect?.(emoji);
        onClose?.();
    };

    if (!isOpen || !portalRootRef.current) return null;

    const pickerBody = (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9998] bg-black/10 backdrop-blur-[1px]" 
                onClick={onClose}
            />
            {/* Container */}
            <div
                ref={pickerRef}
                className={`fixed z-[9999] shadow-2xl rounded-xl border border-gray-200 bg-white transition-opacity ${coords.ready ? 'opacity-100' : 'opacity-0'}`}
                style={{ top: coords.top, left: coords.left, width: PICKER_DIMENSIONS.width }}
            >
                <PickerCore
                    onEmojiClick={handleEmojiClick}
                    theme="light"
                    width={PICKER_DIMENSIONS.width}
                    height={PICKER_DIMENSIONS.height}
                    autoFocusSearch={false}
                    skinTonesDisabled={false}
                    searchDisabled={false}
                    emojiStyle="native"
                    lazyLoadEmojis
                    suggestedEmojisMode="frequent"
                    previewConfig={{
                        showPreview: true,
                        defaultEmoji: '1f60a',
                        defaultCaption: "What's on your mind?"
                    }}
                />
            </div>
        </>
    );

    return createPortal(pickerBody, portalRootRef.current);
};

export default CustomEmojiPicker;