import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Initial state
const initialState = {
  courses: [],
  courseDetails: null,
  isLoading: false,
  error: null,
  stats: null,
};

// Async thunks
export const fetchCourses = createAsyncThunk(
  'dashboard/fetchCourses',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch courses');
    }
  }
);

export const fetchCourseDetails = createAsyncThunk(
  'dashboard/fetchCourseDetails',
  async (courseId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch course details');
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const { role } = getState().auth;
      
      const endpoint = role === 'Instructor' 
        ? `${API_URL}/instructors/stats` 
        : `${API_URL}/students/stats`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch dashboard statistics');
    }
  }
);

// Slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCourseDetails: (state) => {
      state.courseDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch courses cases
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch course details cases
      .addCase(fetchCourseDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courseDetails = action.payload;
      })
      .addCase(fetchCourseDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch dashboard stats cases
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCourseDetails } = dashboardSlice.actions;

export default dashboardSlice.reducer;

