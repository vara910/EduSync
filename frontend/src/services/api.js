import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5036/api', // Updated to match our C# backend port
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout configuration
  timeout: 30000, // 30 seconds timeout for requests
});

// Add a request interceptor to attach authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't override Content-Type if it's already set for multipart/form-data
    // This is important for file uploads
    if (config.headers['Content-Type'] === 'multipart/form-data' || 
        (config.data instanceof FormData)) {
      // If we have FormData, let the browser set the Content-Type header with boundary
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (!error.response) {
      // Network error or timeout
      console.error('Network error or request timeout. Please check your connection.');
      return Promise.reject(new Error('Network error or request timeout. Please check your connection.'));
    }
    
    // Handle based on HTTP status code
    switch (error.response.status) {
      case 401:
        // Unauthorized - Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
        
      case 413:
        // Payload too large - typically for file uploads
        console.error('The file you are trying to upload is too large.');
        return Promise.reject(new Error('The file you are trying to upload is too large. Please select a smaller file.'));
        
      case 415:
        // Unsupported Media Type - wrong file format
        console.error('The file format is not supported.');
        return Promise.reject(new Error('The file format is not supported. Please select a different file.'));
        
      case 403:
        // Forbidden - No permission
        console.error('You do not have permission to perform this action.');
        return Promise.reject(new Error('You do not have permission to perform this action.'));
        
      case 404:
        // Not Found
        console.error('The requested resource could not be found.');
        return Promise.reject(new Error('The requested resource could not be found.'));
        
      case 500:
        // Server error
        console.error('Internal server error. Please try again later.');
        return Promise.reject(new Error('Internal server error. Please try again later.'));
    }
    
    // Pass along the error for other status codes
    return Promise.reject(error);
  }
);

/**
 * Helper function to create form data with progress tracking
 * Use this for file uploads to properly set up FormData
 * @param {File} file - The file to upload
 * @param {Object} additionalData - Additional form fields
 * @returns {FormData} - The prepared FormData object
 */
export const createFormData = (file, additionalData = {}) => {
  const formData = new FormData();
  
  // Add the file
  if (file) {
    formData.append('file', file);
  }
  
  // Add any additional data
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });
  
  return formData;
};

export default api;
