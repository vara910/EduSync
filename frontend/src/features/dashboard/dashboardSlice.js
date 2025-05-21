import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Async thunks

// Combined fetch for student dashboard data
export const fetchStudentDashboardData = createAsyncThunk(
  'dashboard/fetchStudentDashboardData',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const [coursesResponse, resultsResponse] = await Promise.all([
        dispatch(fetchEnrolledCourses()).unwrap(),
        dispatch(fetchStudentResults()).unwrap()
      ]);
      
      return {
        courses: coursesResponse,
        results: resultsResponse
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard data');
    }
  }
);

// Combined fetch for instructor dashboard data
export const fetchInstructorDashboardData = createAsyncThunk(
  'dashboard/fetchInstructorDashboardData',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const [coursesResponse, summariesResponse] = await Promise.all([
        dispatch(fetchInstructorCourses()).unwrap(),
        dispatch(fetchAssessmentSummaries()).unwrap()
      ]);
      
      return {
        courses: coursesResponse,
        summaries: summariesResponse
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch instructor dashboard data');
    }
  }
);
export const fetchEnrolledCourses = createAsyncThunk(
  'dashboard/fetchEnrolledCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/courses/enrolled`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch enrolled courses');
    }
  }
);

export const fetchInstructorCourses = createAsyncThunk(
  'dashboard/fetchInstructorCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/courses/instructor`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch instructor courses');
    }
  }
);

export const fetchStudentResults = createAsyncThunk(
  'dashboard/fetchStudentResults',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assessments/results/my`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assessment results');
    }
  }
);

export const fetchCourseResults = createAsyncThunk(
  'dashboard/fetchCourseResults',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assessments/results/course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course results');
    }
  }
);

export const fetchAssessmentSummaries = createAsyncThunk(
  'dashboard/fetchAssessmentSummaries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assessments/summaries`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assessment summaries');
    }
  }
);

export const uploadCourseMaterial = createAsyncThunk(
  'dashboard/uploadCourseMaterial',
  async ({ courseId, file }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/courses/${courseId}/materials/upload`,
        file,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload course material');
    }
  }
);

const initialState = {
  // Data stores
  enrolledCourses: [],
  instructorCourses: null,
  studentResults: [],
  courseResults: [],
  assessmentSummaries: [],
  
  // Loading and error states for individual operations
  isLoading: false,
  error: null,
  
  // Combined dashboard states with individual loading indicators
  studentDashboard: {
    isLoading: false,
    error: null,
    lastUpdated: null
  },
  instructorDashboard: {
    isLoading: false,
    error: null,
    lastUpdated: null
  },
  
  // Material upload status
  materialUploadStatus: {
    isUploading: false,
    success: false,
    error: null
  }
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.studentDashboard.error = null;
      state.instructorDashboard.error = null;
      state.materialUploadStatus.error = null;
    },
    resetUploadStatus: (state) => {
      state.materialUploadStatus = {
        isUploading: false,
        success: false,
        error: null
      };
    },
    refreshDashboard: (state) => {
      // Used to manually trigger a refresh in the UI
      state.studentDashboard.lastUpdated = null;
      state.instructorDashboard.lastUpdated = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchEnrolledCourses
      .addCase(fetchEnrolledCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEnrolledCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enrolledCourses = action.payload;
      })
      .addCase(fetchEnrolledCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch enrolled courses';
      })
      
      // fetchInstructorCourses
      .addCase(fetchInstructorCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInstructorCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.instructorCourses = action.payload;
      })
      .addCase(fetchInstructorCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch instructor courses';
      })
      
      // fetchStudentResults
      .addCase(fetchStudentResults.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentResults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studentResults = action.payload;
      })
      .addCase(fetchStudentResults.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch student results';
      })
      
      // fetchCourseResults
      .addCase(fetchCourseResults.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseResults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courseResults = action.payload;
      })
      .addCase(fetchCourseResults.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch course results';
      })
      
      // fetchAssessmentSummaries
      .addCase(fetchAssessmentSummaries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssessmentSummaries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assessmentSummaries = action.payload;
      })
      .addCase(fetchAssessmentSummaries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch assessment summaries';
      })
      
      // uploadCourseMaterial
      .addCase(uploadCourseMaterial.pending, (state) => {
        state.materialUploadStatus = {
          isUploading: true,
          success: false,
          error: null
        };
      })
      .addCase(uploadCourseMaterial.fulfilled, (state) => {
        state.materialUploadStatus = {
          isUploading: false,
          success: true,
          error: null
        };
      })
      .addCase(uploadCourseMaterial.rejected, (state, action) => {
        state.materialUploadStatus = {
          isUploading: false,
          success: false,
          error: action.payload || 'Failed to upload course material'
        };
      })
      
      // Combined student dashboard data
      .addCase(fetchStudentDashboardData.pending, (state) => {
        state.studentDashboard.isLoading = true;
        state.studentDashboard.error = null;
      })
      .addCase(fetchStudentDashboardData.fulfilled, (state) => {
        state.studentDashboard.isLoading = false;
        state.studentDashboard.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchStudentDashboardData.rejected, (state, action) => {
        state.studentDashboard.isLoading = false;
        state.studentDashboard.error = action.payload || 'Failed to fetch student dashboard data';
      })
      
      // Combined instructor dashboard data
      .addCase(fetchInstructorDashboardData.pending, (state) => {
        state.instructorDashboard.isLoading = true;
        state.instructorDashboard.error = null;
      })
      .addCase(fetchInstructorDashboardData.fulfilled, (state) => {
        state.instructorDashboard.isLoading = false;
        state.instructorDashboard.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchInstructorDashboardData.rejected, (state, action) => {
        state.instructorDashboard.isLoading = false;
        state.instructorDashboard.error = action.payload || 'Failed to fetch instructor dashboard data';
      });
  }
});

export const { clearErrors, resetUploadStatus, refreshDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
