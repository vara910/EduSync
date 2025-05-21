import api, { createFormData } from './api';

/**
 * Helper function to validate if a string is a valid GUID format
 * @param {string} id - The ID to validate
 * @returns {boolean} - Whether the ID is a valid GUID
 */
const isValidGuid = (id) => {
  if (!id) return false;
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(id);
};

/**
 * Helper function to attempt to format a string as a GUID
 * @param {string} id - The ID to format
 * @returns {string|null} - Formatted GUID or null if invalid
 */
const formatGuid = (id) => {
  if (!id) return null;
  // Remove any non-alphanumeric characters and format as GUID
  const cleaned = id.toString().replace(/[^a-f0-9]/gi, '');
  if (cleaned.length !== 32) return null;
  return `${cleaned.slice(0,8)}-${cleaned.slice(8,12)}-${cleaned.slice(12,16)}-${cleaned.slice(16,20)}-${cleaned.slice(20)}`;
};

/**
 * Course service for EduSync
 */
const CourseService = {
  /**
   * Get all available courses
   * @returns {Promise} List of courses
   */
  getCourses: async () => {
    try {
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },
  
  /**
   * Alias for getCourses for better naming consistency
   */
  getAllCourses: async () => {
    return CourseService.getCourses();
  },

  /**
   * Get a specific course by ID
   * @param {string} courseId Course ID
   * @returns {Promise} Course details
   */
  getCourseById: async (courseId) => {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }

      // Validate and attempt to format the GUID if needed
      if (!isValidGuid(courseId)) {
        console.warn(`Course ID ${courseId} is not a valid GUID format, attempting to format...`);
        const formattedId = formatGuid(courseId);
        if (!formattedId) {
          console.error(`Failed to format course ID ${courseId} as a valid GUID`);
          throw new Error('Invalid course ID format');
        }
        console.log(`Reformatted course ID to: ${formattedId}`);
        courseId = formattedId;
      }

      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching course ${courseId}:`, error);
      // Handle custom error messages
      if (error.message === 'Invalid course ID format') {
        throw new Error('Invalid course ID format. Please check the URL and try again.');
      } else if (error.response && error.response.status === 400) {
        throw new Error('Bad request: The server could not understand the request due to invalid syntax.');
      } else if (error.response && error.response.status === 404) {
        throw new Error('Course not found. It may have been deleted or you may not have access to it.');
      }
      throw error;
    }
  },
  
  /**
   * Alias for getCourseById for better naming consistency
   */
  getCourse: async (courseId) => {
    return CourseService.getCourseById(courseId);
  },

  /**
   * Create a new course (instructor only)
   * @param {Object} courseData Course data
   * @returns {Promise} Created course
   */
  createCourse: async (courseData) => {
    try {
      const response = await api.post('/courses', courseData);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  /**
   * Update an existing course (instructor only)
   * @param {string} courseId Course ID
   * @param {Object} courseData Updated course data
   * @returns {Promise} Updated course
   */
  updateCourse: async (courseId, courseData) => {
    try {
      const response = await api.put(`/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      console.error(`Error updating course ${courseId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a course (instructor only)
   * @param {string} courseId Course ID
   * @returns {Promise} Operation result
   */
  deleteCourse: async (courseId) => {
    try {
      const response = await api.delete(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting course ${courseId}:`, error);
      throw error;
    }
  },

  /**
   * Get courses created by an instructor
   * @returns {Promise} List of instructor's courses
   */
  getInstructorCourses: async () => {
    try {
      // We'll use the same endpoint but filter on the frontend based on user role
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      throw error;
    }
  },

  /**
   * Get courses a student is enrolled in
   * @returns {Promise} List of enrolled courses
   */
  getStudentEnrollments: async () => {
    try {
      // We'll use the same endpoint but filter differently
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      throw error;
    }
  },

  /**
   * Upload course material (instructor only)
   * @param {string} courseId Course ID
   * @param {File} file File to upload
   * @param {Object} options Additional options
   * @param {Function} options.onUploadProgress Progress callback
   * @param {string} options.category Material category
   * @param {Object} options.metadata Additional metadata for the file
   * @returns {Promise} Upload result with file path
   */
  uploadCourseMaterial: async (courseId, file, options = {}) => {
    try {
      // Validate inputs
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      
      if (!file || !(file instanceof File)) {
        throw new Error('A valid file is required for upload');
      }
      
      // Prepare additional data for the form
      const additionalData = {
        category: options.category || 'other',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      };
      
      // Add any custom metadata if provided
      if (options.metadata && typeof options.metadata === 'object') {
        Object.keys(options.metadata).forEach(key => {
          additionalData[`metadata_${key}`] = options.metadata[key];
        });
      }
      
      // Use the helper to create FormData
      const formData = createFormData(file, additionalData);
      
      // Custom config to handle file upload
      const config = {};
      
      // Add upload progress tracking if callback is provided
      if (options.onUploadProgress && typeof options.onUploadProgress === 'function') {
        config.onUploadProgress = options.onUploadProgress;
      }
      
      // Updated endpoint for local storage
      const response = await api.post(`/courses/${courseId}/materials/upload`, formData, config);
      return response.data;
    } catch (error) {
      console.error(`Error uploading material for course ${courseId}:`, error);
      
      // Handle specific file upload errors with more user-friendly messages
      if (!error.response) {
        throw new Error('Network error while uploading. Please check your connection and try again.');
      }
      
      switch (error.response?.status) {
        case 400:
          throw new Error('Invalid request. Please check your file and try again.');
        case 401:
          throw new Error('You must be logged in to upload files.');
        case 403:
          throw new Error('You do not have permission to upload files to this course.');
        case 413:
          throw new Error(`The file "${file.name}" exceeds the maximum allowed size.`);
        case 415:
          throw new Error(`The file type of "${file.name}" is not supported.`);
        case 500:
          throw new Error('Server error while uploading. Please try again later.');
        default:
          // Use the error message from the server if available, otherwise use the error object
          throw error.response?.data?.message 
            ? new Error(error.response.data.message)
            : error;
      }
    }
  },

  /**
   * Get all materials for a course
   * @param {string} courseId Course ID
   * @param {string} category Optional category filter
   * @returns {Promise} List of course materials
   */
  getMaterials: async (courseId, category = null) => {
    try {
      // Updated endpoint for local storage
      let url = `/courses/${courseId}/materials/list`;
      
      // Add category filter if provided
      if (category) {
        url += `?category=${encodeURIComponent(category)}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching materials for course ${courseId}:`, error);
      throw error;
    }
  },

  /**
   * Get a specific course material
   * @param {string} courseId Course ID
   * @param {string} fileName File name
   * @returns {Promise} Material file content
   */
  getMaterial: async (courseId, fileName) => {
    try {
      // Updated endpoint for local storage - use file name instead of ID
      const response = await api.get(`/courses/${courseId}/materials/download/${encodeURIComponent(fileName)}`, {
        responseType: 'blob' // Important for file downloads
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching material ${fileName} for course ${courseId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a course material (instructor only)
   * @param {string} courseId Course ID
   * @param {string} fileName File name
   * @returns {Promise} Operation result
   */
  deleteMaterial: async (courseId, fileName) => {
    try {
      // Updated endpoint for local storage - use file name instead of ID
      const response = await api.delete(`/courses/${courseId}/materials/${encodeURIComponent(fileName)}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting material ${fileName} for course ${courseId}:`, error);
      throw error;
    }
  },
  
  /**
   * Check if file URL is a local storage path
   * @param {string} url The file URL
   * @returns {boolean} True if it's a local path
   */
  isLocalStorageUrl: (url) => {
    return url && (url.startsWith('file://') || url.includes('localhost'));
  },
  
  /**
   * Convert a local storage URL to a download URL
   * @param {string} url Original URL
   * @param {string} courseId Course ID
   * @param {string} fileName File name
   * @returns {string} Download URL
   */
  getDownloadUrl: (url, courseId, fileName) => {
    if (CourseService.isLocalStorageUrl(url)) {
      return `/api/courses/${courseId}/materials/download/${encodeURIComponent(fileName)}`;
    }
    return url;
  }
};

export default CourseService;
