import React, { useState, useEffect } from 'react';
import { FiEdit3, FiSave, FiX, FiCamera } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GetProfileRoute, UpdateProfileRoute } from '../apiroutes';

const UserProfile = ({ isOpen, onClose, currentUser, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        profilePhoto: '',
        password: '',
        confirmPassword: ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setProfileData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                profilePhoto: currentUser.profilePhoto || '',
                password: '',
                confirmPassword: ''
            });
        }
    }, [currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfileData(prev => ({
                    ...prev,
                    profilePhoto: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        // Validate password if changing
        if (showPasswordFields) {
            if (profileData.password.length < 8) {
                toast.error('Password must be at least 8 characters long');
                return;
            }
            if (!/[A-Z]/.test(profileData.password)) {
                toast.error('Password must contain at least one uppercase letter');
                return;
            }
            if (!/[a-z]/.test(profileData.password)) {
                toast.error('Password must contain at least one lowercase letter');
                return;
            }
            if (!/[0-9]/.test(profileData.password)) {
                toast.error('Password must contain at least one number');
                return;
            }
            if (!/[!@#$%^&*]/.test(profileData.password)) {
                toast.error('Password must contain at least one special character (!@#$%^&*)');
                return;
            }
            if (profileData.password !== profileData.confirmPassword) {
                toast.error('Passwords do not match');
                return;
            }
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('auth-token');
            const formData = new FormData();
            
            if (showPasswordFields && profileData.password) {
                formData.append('password', profileData.password);
            }
            // Always include username if editing to allow backend change
            if (isEditing && profileData.username) {
                formData.append('username', profileData.username.trim());
            }
            if (profileImage) {
                formData.append('profilePhoto', profileImage);
            }

            const response = await axios.put(
                `${UpdateProfileRoute}/${currentUser._id}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            toast.success(response.data.message || 'Profile updated successfully!');
            setIsEditing(false);
            setShowPasswordFields(false);
            
            // Always update local stored user from server copy to ensure consistency
            if (response.data.user) {
                localStorage.setItem('chat-app-user', JSON.stringify(response.data.user));
                onUpdate(response.data.user);
            } else {
                // Fallback: refresh from local currentUser
                onUpdate({ ...currentUser });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            let errorMessage = 'Failed to update profile';
            
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

    const handleCancel = () => {
        setIsEditing(false);
        setShowPasswordFields(false);
        setProfileImage(null);
        if (currentUser) {
            setProfileData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                profilePhoto: currentUser.profilePhoto || '',
                password: '',
                confirmPassword: ''
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEditing ? 'Edit Profile' : 'Profile'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Profile Content */}
                <div className="p-6">
                    {/* Profile Photo */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                            {profileData.profilePhoto ? (
                                <img
                                    src={profileData.profilePhoto}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-blue-100">
                                    <span className="text-white text-2xl font-bold">
                                        {profileData.username?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            {isEditing && (
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
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="username"
                                    value={profileData.username}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                                    {profileData.username}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                                {profileData.email}
                            </p>
                        </div>

                        {/* Password Change Section */}
                        {isEditing && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Change Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordFields(!showPasswordFields)}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        {showPasswordFields ? 'Cancel' : 'Change Password'}
                                    </button>
                                </div>
                                
                                {showPasswordFields && (
                                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                        <input
                                            type="password"
                                            name="password"
                                            value={profileData.password}
                                            onChange={handleInputChange}
                                            placeholder="New Password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={profileData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Confirm New Password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-600">
                                            Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-6">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <FiSave size={16} />
                                    )}
                                    <span>{loading ? 'Saving...' : 'Save'}</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
                            >
                                <FiEdit3 size={16} />
                                <span>Edit Profile</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;