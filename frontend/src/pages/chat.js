import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    FiSend, 
    FiPaperclip, 
    FiMoreVertical, 
    FiLogOut, 
    FiZap, 
    FiUser, 
    FiUsers,
    FiPlus,
    FiSettings,
    FiSearch,
    FiImage,
    FiTrash2,
    FiEdit3,
    FiLoader,
    FiMoreHorizontal
} from 'react-icons/fi';
import { 
    GetMessagesRoute, 
    SendMessageRoute, 
    SendAIMessageRoute, 
    SearchUsersRoute,
    GetOnlineUsersRoute,
    GetRecentChatsRoute,
    GetUserGroupsRoute,
    CreateGroupRoute,
    GetGroupRoute,
    GetGroupMessagesRoute,
    DeleteMessageRoute,
    MarkAsReadRoute,
    BackendUrl 
} from '../apiroutes';
import { SearchGroupsRoute } from '../apiroutes';
import UserProfile from '../components/UserProfile';
import GroupModal from '../components/GroupModal';
import GroupManagement from '../components/GroupManagement';
import EmojiButton from '../components/EmojiButton';
import ChatHeader from '../components/chat/ChatHeader';
import Sidebar from '../components/chat/Sidebar';
import MessagesList from '../components/chat/MessagesList';
import MessageInput from '../components/chat/MessageInput';

const Chat = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    
    // Socket and user state
    const [currentUser, setCurrentUser] = useState(null);
    
    // Chat state
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    
    // User management
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentChats, setRecentChats] = useState([]);
    const [filteredChats, setFilteredChats] = useState([]); // local filtered chats for search UX
    const [groupSearchResults, setGroupSearchResults] = useState([]);
    const searchDebounceRef = useRef(null);
    const [isSearching, setIsSearching] = useState(false);

    // Utility to merge by _id (for chats search display)
    const mergeUnique = (a, b) => {
        const map = new Map();
        [...a, ...b].forEach(item => { if (item && item._id) map.set(item._id, item); });
        return Array.from(map.values());
    };
    
    // UI state
    const [isTyping, setIsTyping] = useState(false);
    const [userTyping, setUserTyping] = useState(null);
    const [showAIChat, setShowAIChat] = useState(false);
    const [activeTab, setActiveTab] = useState('chats');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showGroupManagement, setShowGroupManagement] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showMessageOptions, setShowMessageOptions] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(new Map()); // userId/groupId -> count
    
    // Loading states
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingRecentChats, setIsLoadingRecentChats] = useState(false);
    
    // Group state
    const [groups, setGroups] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // mobile sidebar toggle

    // AI Assistant user object
    const aiUser = {
        _id: 'ai-assistant',
        username: 'AI Assistant',
        email: 'ai@abhigram.com',
        profilePhoto: '',
        isOnline: true
    };

    // Initialize socket connection
    const initializeSocket = useCallback(() => {
        const token = localStorage.getItem('auth-token');
        if (!token) return null;

        console.log('🔗 Initializing socket connection to:', BackendUrl);
        console.log('🔑 Using auth token:', token ? 'Present' : 'Missing');
        
        const socket = io(BackendUrl, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            maxReconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected to server, Socket ID:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            // Only show toast if user was actively using the app
            if (document.visibilityState === 'visible') {
                toast.warning('Connection lost', { autoClose: 2000 });
            }
        });

        socket.on('reconnect', () => {
            console.log('🔄 Reconnected to server');
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            // Only show error toast for persistent connection issues
            toast.error('Connection failed', { autoClose: 3000 });
        });

        socket.on('new_message', (message) => {
            console.log('📩 Received new_message:', message);
            if (selectedUser &&
                (message.sender._id === selectedUser._id || message.receiver._id === selectedUser._id)) {
                // Avoid duplicating messages we already optimistically added or already present
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) {
                        return prev;
                    }
                    // Skip adding if it's our own message already added locally (no _id duplication yet)
                    if (message.sender._id === currentUser?._id) {
                        return prev;
                    }
                    console.log('✅ Message added to current chat');
                    return [...prev, message];
                });
            } else {
                console.log('📩 Message received for different chat, updating unread count');
                // Update unread count for the sender
                const senderId = message.sender._id;
                if (senderId !== currentUser?._id) {
                    setUnreadMessages(prev => {
                        const newMap = new Map(prev);
                        newMap.set(senderId, (newMap.get(senderId) || 0) + 1);
                        return newMap;
                    });
                    
                    // Update recent chats to show the new message
                    setRecentChats(prev => {
                        const existingChatIndex = prev.findIndex(chat => chat._id === senderId);
                        const updatedChats = [...prev];
                        
                        if (existingChatIndex !== -1) {
                            // Update existing chat
                            updatedChats[existingChatIndex] = {
                                ...updatedChats[existingChatIndex],
                                lastMessage: message
                            };
                            // Move to top
                            const [updatedChat] = updatedChats.splice(existingChatIndex, 1);
                            updatedChats.unshift(updatedChat);
                        } else {
                            // Add new chat to top
                            updatedChats.unshift({
                                ...message.sender,
                                lastMessage: message
                            });
                        }
                        
                        return updatedChats;
                    });
                }
            }
        });

        socket.on('new_group_message', (message) => {
            console.log('👥 Received new_group_message:', message);
            if (selectedGroup && message.group === selectedGroup._id) {
                // Always update messages state for active group
                setMessages(prev => {
                    // Prevent duplicates
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            } else {
                // Message for another group: update unread count only
                const groupId = message.group;
                if (message.sender._id !== currentUser?._id) {
                    setUnreadMessages(prev => {
                        const newMap = new Map(prev);
                        newMap.set(groupId, (newMap.get(groupId) || 0) + 1);
                        return newMap;
                    });
                }
            }
        });

        socket.on('typing_status', ({ userId, isTyping, username }) => {
            console.log('⌨️ Received typing_status:', { userId, isTyping, username });
            if (selectedUser && userId === selectedUser._id) {
                console.log('✅ Setting typing status for current user');
                setUserTyping(isTyping ? (username || selectedUser.username) : null);
            } else if (selectedGroup && isTyping) {
                // For groups, show who is typing
                setUserTyping(isTyping ? (username || 'Someone') : null);
            }
        });

        socket.on('user_status_change', ({ userId, status }) => {
            console.log('👤 User status change:', { userId, status });
            setOnlineUsers(prev => {
                if (status === 'online') {
                    console.log('✅ User came online:', userId);
                    return [...prev.filter(id => id !== userId), userId];
                } else {
                    console.log('❌ User went offline:', userId);
                    return prev.filter(id => id !== userId);
                }
            });
        });

        // Handle message sent confirmation
        socket.on('message_sent', (message) => {
            console.log('📨 Message sent confirmation:', message);
            // Message already added to UI via optimistic update
        });

        // Handle message errors
        socket.on('message_error', ({ error }) => {
            console.error('💥 Message error:', error);
            toast.error(error || 'Failed to send message');
        });

        // Handle message status updates (read receipts)
        socket.on('message_status_update', ({ messageId, status }) => {
            console.log('📖 Message status update:', { messageId, status });
            if (status === 'read') {
                setMessages(prev => prev.map(msg => 
                    msg._id === messageId ? { ...msg, read: true } : msg
                ));
            }
        });

        // Handle group message read status
        socket.on('group_message_read', ({ messageId, userId: readByUserId, groupId }) => {
            console.log('👥📖 Group message read:', { messageId, readByUserId, groupId });
            if (selectedGroup && groupId === selectedGroup._id) {
                setMessages(prev => prev.map(msg => {
                    if (msg._id === messageId) {
                        const readArray = msg.read || [];
                        const alreadyRead = readArray.some(r => r.user._id === readByUserId);
                        if (!alreadyRead) {
                            return {
                                ...msg,
                                read: [...readArray, { user: { _id: readByUserId }, readAt: new Date() }]
                            };
                        }
                    }
                    return msg;
                }));
            }
        });

        // Handle file upload notifications
        socket.on('file_uploaded', ({ messageId, type, groupId, receiverId }) => {
            console.log('📎 File upload notification:', { messageId, type, groupId, receiverId });
            // File already added to sender's UI via HTTP response
            // This event can be used for additional real-time features like upload notifications
        });

        return socket;
    }, [selectedUser, selectedGroup]);

    // Initialize user and socket
    useEffect(() => {
        const initializeApp = async () => {
            setIsInitialLoading(true);
            const user = localStorage.getItem('chat-app-user');
            const token = localStorage.getItem('auth-token');
            
            if (!user || !token) {
                navigate('/login');
                return;
            }

            try {
                const userData = JSON.parse(user);
                setCurrentUser(userData);
                
                // Initialize socket
                const socket = initializeSocket();
                if (socket) {
                    socketRef.current = socket;
                    
                    // Wait for socket connection before loading data
                    socket.on('connect', async () => {
                        try {
                            await Promise.all([
                                loadOnlineUsers(),
                                loadRecentChats(),
                                loadUserGroups()
                            ]);
                        } catch (error) {
                            console.error('Error loading initial data:', error);
                        } finally {
                            setIsInitialLoading(false);
                        }
                    });
                } else {
                    setIsInitialLoading(false);
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                navigate('/login');
            }
        };

        initializeApp();

        return () => {
            if (socketRef.current) {
                // Clean up all socket listeners
                socketRef.current.off('connect');
                socketRef.current.off('disconnect');
                socketRef.current.off('reconnect');
                socketRef.current.off('connect_error');
                socketRef.current.off('new_message');
                socketRef.current.off('new_group_message');
                socketRef.current.off('typing_status');
                socketRef.current.off('user_status_change');
                socketRef.current.off('message_sent');
                socketRef.current.off('message_error');
                socketRef.current.off('message_status_update');
                socketRef.current.off('group_message_read');
                socketRef.current.off('file_uploaded');
                
                socketRef.current.close();
                socketRef.current = null;
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [navigate, initializeSocket]);

    // Smart auto-scroll: avoid repeated smooth scrolling on bulk loads to prevent visual glitches
    const prevMessagesLengthRef = useRef(0);
    const lastChatKeyRef = useRef(null); // track last opened chat for scroll enforcement
    useEffect(() => {
        if (!messagesEndRef.current || !messagesContainerRef.current) return;
        const prevLen = prevMessagesLengthRef.current;
        const newLen = messages.length;
        if (newLen === prevLen) return;
        const container = messagesContainerRef.current;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const isNearBottom = distanceFromBottom < 140; // px threshold
        const isBulkLoad = newLen - prevLen > 3; // chat switch or history load
        // Auto-scroll on bulk load OR if user is near the bottom (reading latest messages)
        if (isBulkLoad || isNearBottom) {
            messagesEndRef.current.scrollIntoView({ behavior: isBulkLoad ? 'auto' : 'smooth' });
        }
        prevMessagesLengthRef.current = newLen;
    }, [messages]);

    // Force scroll exactly once when a new chat (user/group/AI) is opened and messages load
    useEffect(() => {
        if (isLoadingMessages) return; // wait until finished
        if (!messagesEndRef.current) return;
        const key = selectedUser ? selectedUser._id : (selectedGroup ? `group:${selectedGroup._id}` : null);
        if (!key) return;
        if (lastChatKeyRef.current !== key) {
            // New chat context: ensure scroll to bottom after render
            lastChatKeyRef.current = key;
            requestAnimationFrame(() => {
                // Double RAF for safety in slower layouts
                requestAnimationFrame(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                });
            });
        }
    }, [isLoadingMessages, selectedUser?._id, selectedGroup?._id, messages.length]);

    // Mark messages as read separately (no scroll side-effects here)
    useEffect(() => {
        if (messages.length === 0 || (!selectedUser && !selectedGroup)) return;
        if (!socketRef.current) return;
        const unread = messages.filter(msg => {
            if (msg.sender._id === currentUser?._id) return false;
            if (!msg.read) return true;
            if (msg.isGroupMessage) {
                return !msg.read.some(r => r.user._id === currentUser?._id);
            }
            return !msg.read; // direct message without read flag
        });
        if (unread.length === 0) return;
        unread.forEach(msg => {
            console.log('📖 Marking message as read:', msg._id);
            socketRef.current.emit('message_read', { messageId: msg._id });
        });
    }, [messages, selectedUser, selectedGroup, currentUser]);

    // Load messages when user/group changes
    useEffect(() => {
        if (selectedUser && selectedUser._id !== 'ai-assistant') {
            // Add a small delay to prevent glitching during rapid selections
            const timeoutId = setTimeout(() => {
                loadMessages(selectedUser._id);
            }, 100);
            return () => clearTimeout(timeoutId);
        } else if (selectedUser && selectedUser._id === 'ai-assistant') {
            const timeoutId = setTimeout(() => {
                loadAIMessages();
            }, 100);
            return () => clearTimeout(timeoutId);
        } else if (selectedGroup) {
            const timeoutId = setTimeout(() => {
                loadGroupMessages(selectedGroup._id);
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [selectedUser, selectedGroup]);

    // Improved scroll-to-bottom behavior: ensure scroll after a chat (user/group/AI) finishes loading
    useEffect(() => {
        if (isLoadingMessages) return; // wait until finished
        if (!messagesEndRef.current) return;
        // Always scroll to bottom on chat switch completion
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }, [isLoadingMessages, selectedUser?._id, selectedGroup?._id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadOnlineUsers = async () => {
        console.log('🌐 HTTP: Loading online users...');
        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                console.log('❌ No auth token found');
                return;
            }
            
            console.log('📤 GET request to:', GetOnlineUsersRoute);
            const response = await axios.get(GetOnlineUsersRoute, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📥 Online users response:', response.data);
            setOnlineUsers(response.data.users?.map(user => user._id) || []);
        } catch (error) {
            console.error('Error loading online users:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const loadRecentChats = async () => {
        console.log('🌐 HTTP: Loading recent chats...');
        setIsLoadingRecentChats(true);
        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                console.log('❌ No auth token found');
                return;
            }
            
            console.log('📤 GET request to:', GetRecentChatsRoute);
            const response = await axios.get(GetRecentChatsRoute, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📥 Recent chats response:', response.data);
            setRecentChats(response.data.recentChats || []);
        } catch (error) {
            console.error('Error loading recent chats:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setIsLoadingRecentChats(false);
        }
    };

    const loadUserGroups = async () => {
        console.log('🌐 HTTP: Loading user groups...');
        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                console.log('❌ No auth token found');
                return;
            }
            
            console.log('📤 GET request to:', GetUserGroupsRoute);
            const response = await axios.get(GetUserGroupsRoute, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📥 User groups response:', response.data);
            setGroups(response.data.groups || []);
        } catch (error) {
            console.error('Error loading groups:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const searchUsers = useCallback(async (query) => {
        if (!query.trim()) {
            console.log('🔍 Empty search query, clearing results');
            setSearchResults([]);
            return;
        }

        console.log('🌐 HTTP: Searching users for query:', query);
        setIsLoadingUsers(true);
        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                console.log('❌ No auth token found');
                return;
            }
            
            console.log('📤 POST request to:', SearchUsersRoute, { query });
            const response = await axios.post(SearchUsersRoute, 
                { query },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('📥 Search users response:', response.data);
            setSearchResults(response.data.users || []);
        } catch (error) {
            console.error('Search error:', error);
            let errorMessage = 'Failed to search users';
            
            if (error.response?.status === 401) {
                errorMessage = 'Session expired. Please login again.';
                navigate('/login');
                return;
            } else if (error.response?.status === 429) {
                errorMessage = 'Too many search requests. Please wait a moment.';
            } else if (error.message?.includes('Network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            toast.error(errorMessage);
        } finally {
            setIsLoadingUsers(false);
        }
    }, [navigate]);

    const selectUser = useCallback(async (user) => {
        // Prevent starting another load while one is in flight
        if (isLoadingMessages) return;
        setSelectedUser(user);
        setSelectedGroup(null);
        setShowAIChat(user._id === 'ai-assistant');
        setSearchQuery('');
        setSearchResults([]);
        setUserTyping(null);
        // Don't clear existing messages immediately to avoid flicker; loader overlay will appear
        setIsLoadingMessages(true);
        if (user._id !== 'ai-assistant') {
            setUnreadMessages(prev => {
                const newMap = new Map(prev);
                newMap.delete(user._id);
                return newMap;
            });
        }
        // Close sidebar on mobile after selecting
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    }, [isLoadingMessages]);

    const selectGroup = useCallback(async (group) => {
        if (isLoadingMessages) return;
        setSelectedGroup(group);
        setSelectedUser(null);
        setShowAIChat(false);
        setUserTyping(null);
        setIsLoadingMessages(true); // keep old messages until new ones arrive
        setUnreadMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(group._id);
            return newMap;
        });
        if (socketRef.current) {
            console.log('🏠 Joining group room:', group._id);
            socketRef.current.emit('join_group', group._id);
        }
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    }, [isLoadingMessages]);

    const loadMessages = async (userId) => {
        console.log('🌐 HTTP: Loading messages for user:', userId);
        // isLoadingMessages already set when selecting; keep it true during fetch
        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                console.log('❌ No auth token found');
                return;
            }
            
            const url = `${GetMessagesRoute}/${userId}`;
            console.log('📤 GET request to:', url);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📥 Messages response:', response.data);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error loading messages:', error);
            toast.error('Failed to load messages');
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const loadGroupMessages = async (groupId) => {
        console.log('🌐 HTTP: Loading group messages for group:', groupId);
        // keep prior messages visible; overlay will show
        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                console.log('❌ No auth token found');
                return;
            }
            
            const url = `${GetGroupMessagesRoute}/${groupId}/messages`;
            console.log('📤 GET request to:', url);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📥 Group messages response:', response.data);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error loading group messages:', error);
            toast.error('Failed to load group messages');
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const loadAIMessages = async () => {
        console.log('🌐 HTTP: Loading AI messages...');
        // preserve current view while loading
        setIsLoadingMessages(true);
        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                console.log('❌ No auth token found');
                return;
            }
            
            // Get AI user from backend first
            console.log('📤 POST request to find AI user:', SearchUsersRoute);
            const searchResponse = await axios.post(SearchUsersRoute, 
                { query: 'AI Assistant' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('📥 AI user search response:', searchResponse.data);
            
            const aiUser = searchResponse.data.users?.find(user => user.email === 'aisystem@gmail.com');
            if (!aiUser) {
                console.log('❌ AI user not found');
                setMessages([]);
                return;
            }
            
            console.log('✅ Found AI user:', aiUser);
            const url = `${GetMessagesRoute}/${aiUser._id}`;
            console.log('📤 GET request to:', url);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📥 AI messages response:', response.data);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error loading AI messages:', error);
            setMessages([]);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const sendMessage = async () => {
        console.log('💬 Attempting to send message...');
        console.log('📝 Message content:', newMessage.trim());
        console.log('📎 File attached:', selectedFile ? selectedFile.name : 'None');
        console.log('👤 Selected user:', selectedUser?.username || 'None');
        console.log('👥 Selected group:', selectedGroup?.name || 'None');
        
    // Allow send if either text OR file present (media-only allowed); block only if neither
    if ((!newMessage.trim() && !selectedFile) || (!selectedUser && !selectedGroup) || isSendingMessage) {
            console.log('❌ Message send validation failed');
            return;
        }

        const messageContent = newMessage.trim();
        const fileToSend = selectedFile;
        
        // Clear input immediately for better UX
        setNewMessage('');
        setSelectedFile(null);
        setIsSendingMessage(true);
        console.log('✅ Message send initiated');

        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                console.log('❌ No auth token found');
                return;
            }
            
            if (showAIChat) {
                console.log('🤖 Sending AI message...');
                console.log('📤 POST request to:', SendAIMessageRoute);
                
                if (fileToSend) {
                    // Send file to AI using FormData
                    const formData = new FormData();
                    formData.append('content', messageContent || ''); // Allow empty content for files
                    formData.append('messageType', getFileType(fileToSend));
                    formData.append('image', fileToSend); // Keep 'image' field name for backend compatibility
                    
                    const response = await axios.post(SendAIMessageRoute, 
                        formData,
                        { 
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data'
                            } 
                        }
                    );
                    console.log('📥 AI file message response:', response.data);
                    
                    if (response.data.messages) {
                        setMessages(prev => [...prev, ...response.data.messages]);
                    }
                } else {
                    // Send text to AI
                    const response = await axios.post(SendAIMessageRoute, 
                        { content: messageContent },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    console.log('📥 AI text message response:', response.data);
                    
                    if (response.data.messages) {
                        setMessages(prev => [...prev, ...response.data.messages]);
                    }
                }
            } else if (selectedGroup) {
                console.log('👥 Sending group message...');
                
                if (fileToSend) {
                    // File uploads must use HTTP with FormData
                    const formData = new FormData();
                    formData.append('content', messageContent || ''); // Allow empty content for files
                    formData.append('messageType', getFileType(fileToSend));
                    formData.append('groupId', selectedGroup._id);
                    formData.append('image', fileToSend);
                    
                    console.log('� POST request for group file to:', SendMessageRoute + '/group');
                    const response = await axios.post(SendMessageRoute + '/group', 
                        formData,
                        { 
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data'
                            } 
                        }
                    );
                    console.log('📥 Group file message response:', response.data);
                    
                    if (response.data.message) {
                        // File uploaded successfully, emit socket event for real-time delivery
                        if (socketRef.current) {
                            socketRef.current.emit('file_uploaded', {
                                groupId: selectedGroup._id,
                                messageId: response.data.message._id,
                                type: 'group'
                            });
                        }
                        setMessages(prev => [...prev, response.data.message]);
                    }
                } else {
                    // Text messages can use socket
                    if (socketRef.current) {
                        const socketData = {
                            groupId: selectedGroup._id,
                            content: messageContent,
                            type: 'text'
                        };
                        console.log('🔌 Emitting group_message via socket:', socketData);
                        socketRef.current.emit('group_message', socketData);
                    } else {
                        console.log('❌ Socket not available, using HTTP fallback');
                        // HTTP fallback for text messages
                        const formData = new FormData();
                        formData.append('content', messageContent || ''); // Allow empty content for files
                        formData.append('messageType', 'text');
                        formData.append('groupId', selectedGroup._id);
                        
                        const response = await axios.post(SendMessageRoute + '/group', formData, {
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data'
                            }
                        });
                        
                        if (response.data.message) {
                            setMessages(prev => [...prev, response.data.message]);
                        }
                    }
                }
            } else {
                console.log('💬 Sending private message (HTTP -> broadcast)...');
                const messageType = fileToSend ? getFileType(fileToSend) : 'text';
                const formData = new FormData();
                formData.append('recieverId', selectedUser._id);
                formData.append('content', messageContent || '');
                formData.append('messageType', messageType);
                if (fileToSend) {
                    formData.append('image', fileToSend);
                    console.log('📎 File attached to private message:', fileToSend.name);
                }

                console.log('📤 POST request to:', SendMessageRoute);
                const response = await axios.post(SendMessageRoute,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                console.log('📥 Private message response:', response.data);

                if (response.data.message) {
                    // Optimistically add to local UI
                    setMessages(prev => [...prev, response.data.message]);

                    // Inform receiver WITHOUT creating duplicate DB entry (reuse file_uploaded channel)
                    if (socketRef.current) {
                        socketRef.current.emit('file_uploaded', {
                            messageId: response.data.message._id,
                            type: 'private',
                            receiverId: selectedUser._id
                        });
                        console.log('🔌 Emitted file_uploaded for private message delivery');
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            let errorMessage = 'Failed to send message';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Session expired. Please login again.';
                navigate('/login');
                return;
            } else if (error.response?.status === 413) {
                errorMessage = 'File too large. Please select a smaller image.';
            } else if (error.response?.status === 429) {
                errorMessage = 'Too many messages. Please wait a moment.';
            } else if (error.message?.includes('Network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            toast.error(errorMessage);
            // Restore message on error
            setNewMessage(messageContent);
            setSelectedFile(fileToSend);
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            const maxSize = 10 * 1024 * 1024; // 10MB - increased for various file types
            if (file.size > maxSize) {
                toast.error('File size must be less than 10MB');
                return;
            }
            
            // Support all file types that Cloudinary supports
            const supportedTypes = [
                // Images
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml',
                // Videos
                'video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv',
                // Audio
                'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/m4a',
                // Documents
                'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain', 'text/csv',
                // Archives
                'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
            ];
            
            if (supportedTypes.includes(file.type) || file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
                setSelectedFile(file);
            } else {
                toast.error('Unsupported file type. Please select an image, video, audio, document, or archive file.');
            }
        }
        // Reset input
        event.target.value = '';
    };

    const handleTyping = useCallback(() => {
        if (socketRef.current && selectedUser && !showAIChat) {
            const typingData = { 
                receiverId: selectedUser._id, 
                isTyping: true 
            };
            console.log('⌨️ Emitting typing_status (start):', typingData);
            socketRef.current.emit('typing_status', typingData);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Set new timeout
            typingTimeoutRef.current = setTimeout(() => {
                if (socketRef.current) {
                    const stopTypingData = { 
                        receiverId: selectedUser._id, 
                        isTyping: false 
                    };
                    console.log('⌨️ Emitting typing_status (stop):', stopTypingData);
                    socketRef.current.emit('typing_status', stopTypingData);
                }
            }, 1000);
        } else {
            console.log('❌ Cannot emit typing status - conditions not met');
        }
    }, [selectedUser, showAIChat]);

    // Helper function to determine file type
    const getFileType = (file) => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        if (file.type === 'application/pdf' || 
            file.type.includes('document') || 
            file.type.includes('sheet') || 
            file.type.includes('presentation') ||
            file.type === 'text/plain' ||
            file.type === 'text/csv') return 'document';
        return 'file';
    };

    const handleEmojiSelect = (emoji) => {
        console.log('😀 Emoji selected:', emoji);
        setNewMessage(prev => prev + emoji);
    };

    const markMessagesAsRead = async (messageIds) => {
        try {
            const token = localStorage.getItem('auth-token');
            if (!token || !messageIds.length) return;
            
            await axios.post(`${MarkAsReadRoute}/${messageIds[0]}`, 
                { messageIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const deleteMessage = async (messageId) => {
        console.log('🌐 HTTP: Deleting message:', messageId);
        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                console.log('❌ No auth token found');
                return;
            }
            
            const url = `${DeleteMessageRoute}/${messageId}`;
            console.log('📤 DELETE request to:', url);
            await axios.delete(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Message deleted successfully');
            
            // Remove message from UI
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
            toast.success('Message deleted');
            setSelectedMessage(null);
            setShowMessageOptions(false);
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error('Failed to delete message');
        }
    };

    const logout = () => {
        localStorage.removeItem('chat-app-user');
        localStorage.removeItem('auth-token');
        if (socketRef.current) {
            socketRef.current.close();
        }
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const formatTime = (timestamp) => {
        try {
            return new Date(timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (error) {
            return '';
        }
    };

    const handleUserUpdate = (updatedUser) => {
        setCurrentUser(updatedUser);
        localStorage.setItem('chat-app-user', JSON.stringify(updatedUser));
    };

    const getChatHeader = () => {
        if (selectedUser) {
            return {
                name: selectedUser.username,
                status: selectedUser._id === 'ai-assistant' 
                    ? 'AI Assistant - Always available' 
                    : onlineUsers.includes(selectedUser._id) ? 'Online' : 'Offline',
                avatar: selectedUser.profilePhoto
            };
        } else if (selectedGroup) {
            return {
                name: selectedGroup.name,
                status: `${selectedGroup.members?.length || 0} members`,
                avatar: selectedGroup.groupImage
            };
        }
        return null;
    };

    const chatHeader = getChatHeader();

    const executeUserSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            await searchUsers(query);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

        // Chats tab
        if (activeTab === 'chats') {
            const trimmed = value.trim();
            if (!trimmed) { setFilteredChats([]); setSearchResults([]); return; }
            const lc = trimmed.toLowerCase();
            setFilteredChats(recentChats.filter(c => c.username?.toLowerCase().includes(lc)));
            if (trimmed.length > 1) {
                searchDebounceRef.current = setTimeout(() => executeUserSearch(trimmed), 300);
            } else {
                setSearchResults([]);
            }
        }

        // Groups tab
        if (activeTab === 'groups') {
            const trimmed = value.trim();
            if (!trimmed) {
                setGroupSearchResults([]);
                return;
            }
            // Local filter first
            const lc = trimmed.toLowerCase();
            const local = groups.filter(g => g.name?.toLowerCase().includes(lc));
            setGroupSearchResults(local);
            if (trimmed.length > 1) {
                searchDebounceRef.current = setTimeout(async () => {
                    try {
                        const token = localStorage.getItem('auth-token');
                        if (!token) return;
                        setIsSearching(true);
                        const resp = await axios.get(`${SearchGroupsRoute}?q=${encodeURIComponent(trimmed)}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (Array.isArray(resp.data.groups)) {
                            // Merge server results with current groups (avoid duplicates by _id)
                            const merged = [...local];
                            resp.data.groups.forEach(gr => {
                                if (!merged.some(m => m._id === gr._id)) merged.push(gr);
                            });
                            setGroupSearchResults(merged);
                        }
                    } catch (err) {
                        console.error('Group search error:', err);
                    } finally {
                        setIsSearching(false);
                    }
                }, 300);
            }
        }
    }, [activeTab, recentChats, groups, searchUsers]);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (activeTab === 'chats') {
                executeUserSearch(searchQuery);
            } else if (activeTab === 'groups' && searchQuery.trim().length > 1) {
                // Force immediate remote group search
                (async () => {
                    try {
                        const token = localStorage.getItem('auth-token');
                        if (!token) return;
                        setIsSearching(true);
                        const resp = await axios.get(`${SearchGroupsRoute}?q=${encodeURIComponent(searchQuery.trim())}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (Array.isArray(resp.data.groups)) {
                            const lc = searchQuery.trim().toLowerCase();
                            const local = groups.filter(g => g.name?.toLowerCase().includes(lc));
                            const merged = [...local];
                            resp.data.groups.forEach(gr => { if (!merged.some(m => m._id === gr._id)) merged.push(gr); });
                            setGroupSearchResults(merged);
                        }
                    } catch (err) {
                        console.error('Immediate group search error:', err);
                    } finally {
                        setIsSearching(false);
                    }
                })();
            }
        }
    };

    const chatSearchDisplay = mergeUnique(filteredChats, searchResults);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Prevent showing UI until initial data is loaded
    if (isInitialLoading || !currentUser) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                <div className="text-center">
                    <div className="relative mb-6">
                        <FiLoader className="animate-spin text-emerald-600 mx-auto" size={48} />
                        <div className="absolute inset-0 bg-emerald-300 rounded-full opacity-25 animate-ping"></div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Chat</h2>
                    <p className="text-gray-600">Connecting to server and loading your conversations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 font-sans relative overflow-hidden">
                        {/* Sidebar (responsive) */}
                        <Sidebar
                            currentUser={currentUser}
                            setShowProfileModal={setShowProfileModal}
                            setShowGroupModal={setShowGroupModal}
                            logout={logout}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            handleSearchChange={handleSearchChange}
                            handleSearchKeyDown={handleSearchKeyDown}
                            executeUserSearch={executeUserSearch}
                            isLoadingUsers={isLoadingUsers}
                            isSearching={isSearching}
                            searchResults={searchResults}
                            chatSearchDisplay={chatSearchDisplay}
                            recentChats={recentChats}
                            selectUser={selectUser}
                            selectedUser={selectedUser}
                            unreadMessages={unreadMessages}
                            formatTime={formatTime}
                            isLoadingRecentChats={isLoadingRecentChats}
                            groupSearchResults={groupSearchResults}
                            groups={groups}
                            selectGroup={selectGroup}
                            selectedGroup={selectedGroup}
                            onlineUsers={onlineUsers}
                            aiUser={aiUser}
                            isMobileVisible={isSidebarOpen}
                            onCloseMobile={() => setIsSidebarOpen(false)}
                        />

                        {/* Chat Area */}
                        <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
                {selectedUser || selectedGroup ? (
                    <>
                        <ChatHeader
                          selectedUser={selectedUser}
                          selectedGroup={selectedGroup}
                          chatHeader={chatHeader}
                          onlineUsers={onlineUsers}
                                                    setShowGroupManagement={setShowGroupManagement}
                                                    onBackMobile={() => setIsSidebarOpen(true)}
                        />
                                                <MessagesList
                                                    messages={messages}
                                                    currentUser={currentUser}
                                                    selectedGroup={selectedGroup}
                                                    formatTime={formatTime}
                                                    userTyping={userTyping}
                                                    isLoadingMessages={isLoadingMessages}
                                                    messagesContainerRef={messagesContainerRef}
                                                    messagesEndRef={messagesEndRef}
                                                    setSelectedMessage={setSelectedMessage}
                                                    setShowMessageOptions={setShowMessageOptions}
                                                />
                        <MessageInput
                          selectedFile={selectedFile}
                          setSelectedFile={setSelectedFile}
                          selectedGroup={selectedGroup}
                          chatHeader={chatHeader}
                          newMessage={newMessage}
                          setNewMessage={setNewMessage}
                          handleTyping={handleTyping}
                          handleKeyPress={handleKeyPress}
                          isSendingMessage={isSendingMessage}
                          sendMessage={sendMessage}
                          fileInputRef={fileInputRef}
                          handleFileSelect={handleFileSelect}
                          getFileType={getFileType}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <FiUser size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to AbhiGram</h3>
                            <p className="text-gray-500 px-4">
                                Search for users to start a conversation, create groups, or chat with AI Assistant
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showProfileModal && (
                <UserProfile 
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    currentUser={currentUser}
                    onUpdate={handleUserUpdate}
                />
            )}
            {showGroupModal && (
                <GroupModal
                    isOpen={showGroupModal}
                    onClose={() => setShowGroupModal(false)}
                    currentUser={currentUser}
                    onGroupCreated={(newGroup) => {
                        setGroups(prev => [...prev, newGroup]);
                        setActiveTab('groups');
                        setSelectedUser(null);
                        setSelectedGroup(newGroup);
                        if (socketRef.current) {
                            socketRef.current.emit('join_group', newGroup._id);
                        }
                        setShowGroupModal(false);

                                {/* Floating open-sidebar button (mobile) */}
                                {!isSidebarOpen && (
                                    <button
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="md:hidden fixed bottom-4 left-4 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-500 active:scale-95 transition"
                                        aria-label="Open chats"
                                    >
                                        ☰
                                    </button>
                                )}
                        toast.success('Group created and opened');
                    }}
                />
            )}
            {showGroupManagement && selectedGroup && (
                <GroupManagement
                    isOpen={showGroupManagement}
                    onClose={() => setShowGroupManagement(false)}
                    group={selectedGroup}
                    currentUser={currentUser}
                    onGroupUpdated={(updatedGroup) => {
                        setGroups(prev => prev.map(g => g._id === updatedGroup._id ? updatedGroup : g));
                        setSelectedGroup(updatedGroup);
                    }}
                />
            )}
            {showMessageOptions && selectedMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-medium text-gray-900">Message Options</h3>
                        </div>
                        <div className="p-4 space-y-2">
                            <button
                                onClick={() => deleteMessage(selectedMessage._id)}
                                className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                                <FiTrash2 size={16} />
                                <span>Delete Message</span>
                            </button>
                        </div>
                        <div className="p-4 border-t border-gray-200">
                            <button
                                onClick={() => { setShowMessageOptions(false); setSelectedMessage(null); }}
                                className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;