import api from './api';

/**
 * Authentication service for EduSync
 */
const AuthService = {
  /**
   * Login with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise} User data with token
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          name: response.data.name,
          email: response.data.email,
          role: response.data.role
        }));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Register a new user
   * @param {Object} userData User registration data
   * @returns {Promise} Registration result
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Logout current user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user information
   * @returns {Object|null} Current user data or null if not logged in
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Check if current user is an instructor
   * @returns {boolean} True if user is an instructor
   */
  isInstructor: () => {
    const user = AuthService.getCurrentUser();
    return user && user.role === 'Instructor';
  },
  
  /**
   * Get the JWT token
   * @returns {string|null} JWT token or null if not logged in
   */
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default AuthService;

