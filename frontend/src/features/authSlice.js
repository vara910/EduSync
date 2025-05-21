import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '../services/auth.service';

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // AuthService handles token storage internally
      const response = await AuthService.login(credentials.email, credentials.password);
      return {
        token: response.token,
        user: {
          name: response.name,
          email: response.email,
          role: response.role
        }
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        'Login failed. Please check your credentials.'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        'Registration failed. Please try again.'
      );
    }
  }
);

// Initialize state from AuthService
const user = AuthService.getCurrentUser();
const token = AuthService.getToken();

const initialState = {
  user: user || null,
  token: token || null,
  isAuthenticated: !!token,
  isLoading: false,
  error: null,
  role: user?.role || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      AuthService.logout();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

