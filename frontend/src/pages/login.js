import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { LoginRoute } from "../apiroutes";
import { handleAuthError, showSuccessMessage } from "../utils/errorHandler";

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const toastOptions = {
        position: "bottom-right",
        autoClose: 5000,
        pauseOnHover: true,
        draggable: true,
        theme: "light", // unified with register page
    };

    const [values, setValues] = useState({
        email: "",
        password: "",
    });

    useEffect(() => {
        if (localStorage.getItem('chat-app-user')) {
            navigate("/chat");
        }
    }, [navigate]);

    const handleValidation = () => {
        const { password, email } = values;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address.", toastOptions);
            return false;
        } else if (password === "") {
            toast.error("Email and Password are required.", toastOptions);
            return false;
        }
        return true;
    };

    const handleChange = (event) => {
        setValues({ ...values, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (handleValidation()) {
            setLoading(true);
            const { email, password } = values;
            try {
                const { data } = await axios.post(LoginRoute, {
                    email,
                    password,
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
                let errorMessage = "Login failed. Please try again.";
                
                if (error.response?.data?.msg) {
                    errorMessage = error.response.data.msg;
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.status === 401) {
                    errorMessage = "Invalid email or password.";
                } else if (error.response?.status === 429) {
                    errorMessage = "Too many login attempts. Please try again later.";
                } else if (error.message?.includes('Network')) {
                    errorMessage = "Network error. Please check your connection.";
                }
                
                toast.error(errorMessage, toastOptions);
                console.error('Login error:', error.response?.data || error.message);
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
                    <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-white transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Signing In...
                            </div>
                        ) : (
                            "Sign In"
                        )}
                    </button>

                    <div className="text-center">
                        <span className="text-gray-600">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-green-600 font-semibold hover:text-green-700 transition duration-200">
                                Sign Up
                            </Link>
                        </span>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
}
