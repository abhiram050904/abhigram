import React, { useState } from 'react';
import { FiX, FiUsers, FiPlus, FiMinus } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CreateGroupRoute, SearchUsersRoute } from '../apiroutes';
import { handleApiError, showSuccessMessage } from '../utils/errorHandler';

const GroupModal = ({ isOpen, onClose, currentUser }) => {
    const [groupData, setGroupData] = useState({
        name: '',
        description: ''
    });
    const [groupImage, setGroupImage] = useState(null);
    const [groupImagePreview, setGroupImagePreview] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGroupData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                toast.error('Group image must be less than 5MB');
                return;
            }
            
            if (file.type.startsWith('image/')) {
                setGroupImage(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    setGroupImagePreview(e.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                toast.error('Please select an image file');
            }
        }
    };

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const token = localStorage.getItem('auth-token');
            const response = await axios.post(SearchUsersRoute, 
                { query },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSearchResults(response.data.users || []);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const addUser = (user) => {
        if (!selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers(prev => [...prev, user]);
        }
    };

    const removeUser = (userId) => {
        setSelectedUsers(prev => prev.filter(u => u._id !== userId));
    };

    const handleCreateGroup = async () => {
        if (!groupData.name.trim()) {
            toast.error('Group name is required');
            return;
        }

        if (selectedUsers.length === 0) {
            toast.error('Please add at least one member');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('auth-token');
            const formData = new FormData();
            
            formData.append('name', groupData.name);
            formData.append('description', groupData.description);
            formData.append('members', JSON.stringify(selectedUsers.map(u => u._id)));

            if (groupImage) {
                formData.append('image', groupImage);
            }

            const response = await axios.post(CreateGroupRoute, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Response now returns populated group (admin & members)

            showSuccessMessage('Group created successfully!');
            resetForm();
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            let errorMessage = 'Failed to create group';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Session expired. Please login again.';
            } else if (error.response?.status === 413) {
                errorMessage = 'File too large. Please select a smaller image.';
            } else if (error.response?.status === 429) {
                errorMessage = 'Too many requests. Please wait a moment.';
            } else if (error.message?.includes('Network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setGroupData({ name: '', description: '' });
        setGroupImage(null);
        setGroupImagePreview(null);
        setSelectedUsers([]);
        setSearchQuery('');
        setSearchResults([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Create Group</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Group Image */}
                    <div className="flex flex-col items-center mb-4">
                        <div className="relative mb-2">
                            {groupImagePreview ? (
                                <img
                                    src={groupImagePreview}
                                    alt="Group Preview"
                                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center border-4 border-blue-100">
                                    <FiUsers className="text-white" size={24} />
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="text-gray-600 text-xs text-center">Group Image (Optional)</p>
                    </div>

                    {/* Group Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Group Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={groupData.name}
                            onChange={handleInputChange}
                            placeholder="Enter group name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            name="description"
                            value={groupData.description}
                            onChange={handleInputChange}
                            placeholder="Enter group description"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                    </div>

                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selected Members ({selectedUsers.length})
                            </label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedUsers.map(user => (
                                    <div key={user._id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            {user.profilePhoto ? (
                                                <img 
                                                    src={user.profilePhoto} 
                                                    alt={user.username}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-gray-900">
                                                {user.username}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeUser(user._id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <FiMinus size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Users */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Add Members
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                searchUsers(e.target.value);
                            }}
                            placeholder="Search users..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                        
                        {searchResults.length > 0 && (
                            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                {searchResults.map(user => (
                                    <div
                                        key={user._id}
                                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => addUser(user)}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {user.profilePhoto ? (
                                                <img 
                                                    src={user.profilePhoto} 
                                                    alt={user.username}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{user.username}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <FiPlus size={16} className="text-blue-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateGroup}
                        disabled={loading || !groupData.name.trim() || selectedUsers.length === 0}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <FiUsers size={16} />
                        )}
                        <span>{loading ? 'Creating...' : 'Create Group'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupModal;