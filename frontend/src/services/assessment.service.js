import api from './api';

/**
 * Assessment service for EduSync
 */
const AssessmentService = {
  /**
   * Get assessments for a course
   * @param {string} courseId Course ID
   * @returns {Promise} List of assessments
   */
  getAssessments: async (courseId) => {
    try {
      const response = await api.get(`/assessments/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching assessments for course ${courseId}:`, error);
      throw error;
    }
  },

  /**
   * Get a specific assessment by ID
   * @param {string} assessmentId Assessment ID
   * @returns {Promise} Assessment details
   */
  getAssessmentById: async (assessmentId) => {
    try {
      const response = await api.get(`/assessments/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching assessment ${assessmentId}:`, error);
      throw error;
    }
  },
  
  /**
   * Alias for getAssessmentById for better naming consistency
   */
  getAssessment: async (assessmentId) => {
    return AssessmentService.getAssessmentById(assessmentId);
  },

  /**
   * Create a new assessment (instructor only)
   * @param {Object} assessmentData Assessment data
   * @returns {Promise} Created assessment
   */
  createAssessment: async (assessmentData) => {
    try {
      const response = await api.post('/assessments', assessmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  },

  /**
   * Update an existing assessment (instructor only)
   * @param {string} assessmentId Assessment ID
   * @param {Object} assessmentData Updated assessment data
   * @returns {Promise} Updated assessment
   */
  updateAssessment: async (assessmentId, assessmentData) => {
    try {
      const response = await api.put(`/assessments/${assessmentId}`, assessmentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating assessment ${assessmentId}:`, error);
      throw error;
    }
  },

  /**
   * Delete an assessment (instructor only)
   * @param {string} assessmentId Assessment ID
   * @returns {Promise} Operation result
   */
  deleteAssessment: async (assessmentId) => {
    try {
      const response = await api.delete(`/assessments/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting assessment ${assessmentId}:`, error);
      throw error;
    }
  },

  /**
   * Submit an assessment attempt
   * @param {Object} submissionData Assessment submission data
   * @returns {Promise} Submission result with score
   */
  submitAssessment: async (submissionData) => {
    try {
      const response = await api.post('/assessments/submit', submissionData);
      return response.data;
    } catch (error) {
      console.error('Error submitting assessment:', error);
      throw error;
    }
  },

  /**
   * Get assessment results for current user
   * @param {string} [courseId] Optional course ID to filter results
   * @returns {Promise} List of assessment results
   */
  getResults: async (courseId = null) => {
    try {
      const url = courseId 
        ? `/assessments/results/my?courseId=${courseId}` 
        : '/assessments/results/my';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching assessment results:', error);
      throw error;
    }
  },

  /**
   * Get all results for a course (instructor only)
   * @param {string} courseId Course ID
   * @returns {Promise} All assessment results for the course
   */
  getCourseResults: async (courseId) => {
    try {
      const response = await api.get(`/assessments/results/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching results for course ${courseId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get summary statistics for an assessment (instructor only)
   * @param {string} assessmentId Assessment ID
   * @returns {Promise} Assessment summary statistics
   */
  getAssessmentSummary: async (assessmentId) => {
    try {
      const response = await api.get(`/assessments/${assessmentId}/summary`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching summary for assessment ${assessmentId}:`, error);
      throw error;
    }
  }
};

export default AssessmentService;
