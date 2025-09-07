import React, { useState, useEffect } from 'react';
import { FiX, FiUsers, FiPlus, FiMinus, FiEdit3, FiSave, FiCamera, FiUserMinus } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { UpdateGroupRoute, AddGroupMemberRoute, RemoveGroupMemberRoute, SearchUsersRoute } from '../apiroutes';
import { handleApiError, showSuccessMessage } from '../utils/errorHandler';

const GroupManagement = ({ isOpen, onClose, group, currentUser, onGroupUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [groupData, setGroupData] = useState({
        name: '',
        description: ''
    });
    const [groupImage, setGroupImage] = useState(null);
    const [groupImagePreview, setGroupImagePreview] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (group) {
            setGroupData({
                name: group.name || '',
                description: group.description || ''
            });
            setGroupImagePreview(group.groupImage || null);
        }
    }, [group]);

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
            // Filter out users who are already members
            const filteredUsers = response.data.users?.filter(user => 
                !group.members.some(member => member._id === user._id)
            ) || [];
            setSearchResults(filteredUsers);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const updateGroup = async () => {
        if (!groupData.name.trim()) {
            toast.error('Group name is required');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('auth-token');
            const formData = new FormData();
            
            formData.append('name', groupData.name);
            formData.append('description', groupData.description);
            
            if (groupImage) {
                formData.append('image', groupImage);
            }

            const response = await axios.put(`${UpdateGroupRoute}/${group._id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            showSuccessMessage('Group updated successfully!');
            setIsEditing(false);
            setGroupImage(null);
            
            if (onGroupUpdated && response.data.group) {
                onGroupUpdated(response.data.group);
            }
        } catch (error) {
            console.error('Error updating group:', error);
            let errorMessage = 'Failed to update group';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Session expired. Please login again.';
            } else if (error.response?.status === 403) {
                errorMessage = 'You do not have permission to update this group.';
            } else if (error.response?.status === 413) {
                errorMessage = 'File too large. Please select a smaller image.';
            } else if (error.message?.includes('Network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const addMember = async (userId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth-token');
            const response = await axios.post(`${AddGroupMemberRoute}/${group._id}`, 
                { members: [userId] },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Member added successfully!');
            setSearchQuery('');
            setSearchResults([]);
            
            if (onGroupUpdated && response.data.group) {
                onGroupUpdated(response.data.group);
            }
        } catch (error) {
            console.error('Error adding member:', error);
            toast.error('Failed to add member');
        } finally {
            setLoading(false);
        }
    };

    const removeMember = async (userId) => {
        if (userId === currentUser._id) {
            toast.error('You cannot remove yourself from the group');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('auth-token');
            const response = await axios.post(`${RemoveGroupMemberRoute}/${group._id}`, 
                { members: [userId] },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Member removed successfully!');
            
            if (onGroupUpdated && response.data.group) {
                onGroupUpdated(response.data.group);
            }
        } catch (error) {
            console.error('Error removing member:', error);
            toast.error('Failed to remove member');
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = group?.admin?._id === currentUser?._id;

    if (!isOpen || !group) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEditing ? 'Edit Group' : 'Group Details'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Group Image and Info */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            {groupImagePreview ? (
                                <img
                                    src={groupImagePreview}
                                    alt="Group"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center border-4 border-blue-100">
                                    <FiUsers className="text-white" size={32} />
                                </div>
                            )}
                            {isEditing && isAdmin && (
                                <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition">
                                    <FiCamera size={16} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>

                        {/* Group Name */}
                        {isEditing && isAdmin ? (
                            <input
                                type="text"
                                name="name"
                                value={groupData.name}
                                onChange={handleInputChange}
                                className="text-xl font-semibold text-center bg-transparent border-b-2 border-blue-400 focus:outline-none mb-2"
                            />
                        ) : (
                            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                                {group.name}
                            </h3>
                        )}

                        {/* Group Description */}
                        {isEditing && isAdmin ? (
                            <textarea
                                name="description"
                                value={groupData.description}
                                onChange={handleInputChange}
                                placeholder="Group description"
                                className="w-full text-center text-gray-600 bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                rows={2}
                            />
                        ) : (
                            <p className="text-gray-600 text-center">
                                {group.description || 'No description'}
                            </p>
                        )}

                        <p className="text-sm text-gray-500 mt-2">
                            Admin: {group.admin?.username}
                        </p>
                    </div>

                    {/* Members List */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                            Members ({group.members?.length || 0})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {group.members?.map(member => (
                                <div key={member._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        {member.profilePhoto ? (
                                            <img 
                                                src={member.profilePhoto} 
                                                alt={member.username}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {member.username.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">{member.username}</p>
                                            {member._id === group.admin?._id && (
                                                <p className="text-xs text-blue-600">Admin</p>
                                            )}
                                        </div>
                                        {member.isOnline && (
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        )}
                                    </div>
                                    {isAdmin && member._id !== currentUser._id && (
                                        <button
                                            onClick={() => removeMember(member._id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            disabled={loading}
                                        >
                                            <FiUserMinus size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Members (Admin Only) */}
                    {isAdmin && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Add Members</h4>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                                placeholder="Search users to add..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            />
                            
                            {searchResults.length > 0 && (
                                <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                                    {searchResults.map(user => (
                                        <div
                                            key={user._id}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => addMember(user._id)}
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
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                    {isAdmin && (
                        <>
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setGroupImage(null);
                                            setGroupData({
                                                name: group.name || '',
                                                description: group.description || ''
                                            });
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={updateGroup}
                                        disabled={loading || !groupData.name.trim()}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <FiSave size={16} />
                                        )}
                                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
                                >
                                    <FiEdit3 size={16} />
                                    <span>Edit Group</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupManagement;