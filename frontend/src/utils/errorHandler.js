import { toast } from 'react-toastify';

// Centralized error handling utility
export const handleApiError = (error, customMessage = null, navigate = null) => {
    let errorMessage = customMessage || 'An error occurred. Please try again.';
    
    // Log technical error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            config: error.config
        });
    } else {
        // In production, only log basic error info
        console.error('API Error:', error.response?.status || error.message);
    }
    
    // Handle different types of errors
    if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        
        switch (status) {
            case 400:
                if (data?.message) {
                    errorMessage = data.message;
                } else if (data?.msg) {
                    errorMessage = data.msg;
                } else {
                    errorMessage = 'Invalid request. Please check your input.';
                }
                break;
                
            case 401:
                errorMessage = 'Session expired. Please login again.';
                if (navigate) {
                    setTimeout(() => navigate('/login'), 1000);
                }
                break;
                
            case 403:
                errorMessage = 'You do not have permission to perform this action.';
                break;
                
            case 404:
                errorMessage = 'Resource not found.';
                break;
                
            case 409:
                errorMessage = data?.message || 'Conflict: Resource already exists.';
                break;
                
            case 413:
                errorMessage = 'File too large. Please select a smaller file.';
                break;
                
            case 429:
                errorMessage = 'Too many requests. Please wait a moment before trying again.';
                break;
                
            case 500:
                errorMessage = 'Server error. Please try again later.';
                break;
                
            case 502:
            case 503:
            case 504:
                errorMessage = 'Service temporarily unavailable. Please try again later.';
                break;
                
            default:
                if (data?.message) {
                    errorMessage = data.message;
                } else if (data?.msg) {
                    errorMessage = data.msg;
                } else {
                    errorMessage = `Request failed with status ${status}.`;
                }
        }
    } else if (error.request) {
        // Network error or no response
        errorMessage = 'Network error. Please check your internet connection.';
    } else {
        // Other errors (like validation errors)
        if (error.message?.toLowerCase().includes('network')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message?.toLowerCase().includes('timeout')) {
            errorMessage = 'Request timeout. Please try again.';
        } else {
            errorMessage = customMessage || 'An unexpected error occurred.';
        }
    }
    
    // Show user-friendly error message
    toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
    });
    
    return errorMessage;
};

// Specific error handlers for common scenarios
export const handleAuthError = (error, navigate) => {
    return handleApiError(error, null, navigate);
};

export const handleFileUploadError = (error) => {
    return handleApiError(error, 'File upload failed. Please check file size and format.');
};

export const handleFormError = (error) => {
    return handleApiError(error, 'Form submission failed. Please check your input.');
};

export const handleNetworkError = (error) => {
    return handleApiError(error, 'Network error. Please check your connection and try again.');
};

// Success message utility
export const showSuccessMessage = (message, options = {}) => {
    toast.success(message, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
    });
};

// Info message utility
export const showInfoMessage = (message, options = {}) => {
    toast.info(message, {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
    });
};

// Warning message utility
export const showWarningMessage = (message, options = {}) => {
    toast.warning(message, {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
    });
};

export default {
    handleApiError,
    handleAuthError,
    handleFileUploadError,
    handleFormError,
    handleNetworkError,
    showSuccessMessage,
    showInfoMessage,
    showWarningMessage
};