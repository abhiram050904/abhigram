import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { RegisterRoute } from "../apiroutes";

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const toastOptions = {
        position: "bottom-right",
        autoClose: 8000,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
    };

    const [values, setValues] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

    useEffect(() => {
        if (localStorage.getItem('chat-app-user')) {
            navigate("/chat");
        }
    }, [navigate]);

    const handleValidation = () => {
        const { password, confirmPassword, username, email } = values;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (password !== confirmPassword) {
            toast.error("Password and confirm password should be the same.", toastOptions);
            return false;
        } else if (username.length < 3) {
            toast.error("Username should be greater than 3 characters.", toastOptions);
            return false;
        } else if (password.length < 8) {
            toast.error("Password should be equal or greater than 8 characters.", toastOptions);
            return false;
        } else if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address.", toastOptions);
            return false;
        }
        return true;
    };

    const handleChange = (event) => {
        setValues({ ...values, [event.target.name]: event.target.value });
    };
    
    const handleProfilePhotoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                toast.error('Profile photo must be less than 5MB', toastOptions);
                return;
            }
            
            if (file.type.startsWith('image/')) {
                setProfilePhoto(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    setProfilePhotoPreview(e.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                toast.error('Please select an image file', toastOptions);
            }
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (handleValidation()) {
            setLoading(true);
            const { email, username, password, confirmPassword } = values;
            try {
                const formData = new FormData();
                formData.append('username', username);
                formData.append('email', email);
                formData.append('password', password);
                formData.append('confirmpassword', confirmPassword);
                
                if (profilePhoto) {
                    formData.append('profilePhoto', profilePhoto);
                }

                const { data } = await axios.post(RegisterRoute, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                setLoading(false);
                if (data.status === false) {
                    toast.error(data.msg, toastOptions);
                } else if (data.status === true) {
                    localStorage.setItem('chat-app-user', JSON.stringify(data.user));
                    localStorage.setItem('auth-token', data.token);
                    navigate("/chat");
                }
            } catch (error) {
                setLoading(false);
                let errorMessage = "Registration failed. Please try again.";
                
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.status === 400) {
                    errorMessage = "Invalid registration data. Please check your information.";
                } else if (error.response?.status === 409) {
                    errorMessage = "User already exists with this email or username.";
                } else if (error.response?.status === 413) {
                    errorMessage = "File too large. Please select a smaller image.";
                } else if (error.message?.includes('Network')) {
                    errorMessage = "Network error. Please check your connection.";
                }
                
                toast.error(errorMessage, toastOptions);
                console.error('Registration error:', error.response?.data || error.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-green-100 p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl font-bold">AG</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">AbhiGram</h1>
                    <p className="text-gray-600">Create your account to get started.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Profile Photo Upload */}
                    <div className="flex flex-col items-center mb-4">
                        <div className="relative mb-2">
                            {profilePhotoPreview ? (
                                <img
                                    src={profilePhotoPreview}
                                    alt="Profile Preview"
                                    className="w-20 h-20 rounded-full object-cover border-4 border-green-200 shadow-md"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-200 shadow-md">
                                    <span className="text-green-600 text-xl font-bold">+</span>
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full cursor-pointer hover:bg-green-600 transition shadow-md">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePhotoChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="text-gray-500 text-xs text-center">Upload Profile Photo (Optional)</p>
                    </div>
                    
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            name="username"
                            value={values.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-green-50/50 border border-green-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                        />
                    </div>
                    
                    <div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            name="email"
                            value={values.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-green-50/50 border border-green-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                        />
                    </div>
                    
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            name="password"
                            value={values.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-green-50/50 border border-green-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                        />
                    </div>
                    
                    <div>
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            name="confirmPassword"
                            value={values.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-green-50/50 border border-green-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-white transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Creating Account...
                            </div>
                        ) : (
                            "Create Account"
                        )}
                    </button>

                    <div className="text-center">
                        <span className="text-gray-600">
                            Already have an account?{" "}
                            <Link to="/login" className="text-green-600 font-semibold hover:text-green-700 transition duration-200">
                                Sign In
                            </Link>
                        </span>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
}