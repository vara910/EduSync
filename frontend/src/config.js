/**
 * Application configuration
 * This file contains configuration settings for the EduSync frontend application
 */

// Determine the base URL for API calls based on environment
let apiBaseUrl;

// Use Vite's environment variables if available
if (import.meta.env.VITE_API_BASE_URL) {
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
} else {
  // Default values based on environment
  if (import.meta.env.MODE === 'production') {
    apiBaseUrl = 'https://api.edusync.com';
  } else {
    // Development default (match the port in backend Program.cs)
    apiBaseUrl = 'http://localhost:5036';
  }
}

// Export constants
export const API_BASE_URL = apiBaseUrl;

// Other configuration settings
export const APP_VERSION = '1.0.0';
export const PAGINATION_LIMIT = 10;
export const FILE_UPLOAD_MAX_SIZE = 50 * 1024 * 1024; // 50MB to match backend
export const SUPPORTED_FILE_TYPES = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png'];

