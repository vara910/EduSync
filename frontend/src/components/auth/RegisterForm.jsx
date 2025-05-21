import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearError } from '../../features/authSlice';
import LoadingSpinner from '../common/LoadingSpinner';

const RegisterForm = () => {
const [formData, setFormData] = useState({
name: '',
email: '',
password: '',
confirmPassword: '',
role: 'Student' // Default role
});

const [validationErrors, setValidationErrors] = useState({});
const [registrationSuccess, setRegistrationSuccess] = useState(false);

const dispatch = useDispatch();
const navigate = useNavigate();
const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

// Clear any previous errors when component mounts
useEffect(() => {
dispatch(clearError());
return () => dispatch(clearError());
}, [dispatch]);

// Redirect if already authenticated
useEffect(() => {
if (isAuthenticated) {
navigate('/dashboard');
}
}, [isAuthenticated, navigate]);

// Navigate to login page after successful registration
useEffect(() => {
if (registrationSuccess) {
const timer = setTimeout(() => {
navigate('/login');
}, 3000);

  return () => clearTimeout(timer);
}

}, [registrationSuccess, navigate]);

const validateForm = () => {
const errors = {};

// Name validation
if (!formData.name.trim()) {
  errors.name = 'Name is required';
} else if (formData.name.trim().length < 2) {
  errors.name = 'Name must be at least 2 characters';
}

// Email validation
if (!formData.email) {
  errors.email = 'Email is required';
} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
  errors.email = 'Email is invalid';
}

// Password validation
if (!formData.password) {
  errors.password = 'Password is required';
} else if (formData.password.length < 6) {
  errors.password = 'Password must be at least 6 characters';
}

// Confirm password validation
if (!formData.confirmPassword) {
  errors.confirmPassword = 'Please confirm your password';
} else if (formData.password !== formData.confirmPassword) {
  errors.confirmPassword = 'Passwords do not match';
}

// Role validation
if (!formData.role) {
  errors.role = 'Please select a role';
}

setValidationErrors(errors);
return Object.keys(errors).length === 0;

};

const handleChange = (e) => {
const { name, value } = e.target;
setFormData({
...formData,
[name]: value
});

// Clear validation error for this field when user types
if (validationErrors[name]) {
  setValidationErrors({
    ...validationErrors,
    [name]: ''
  });
}

};

const handleSubmit = async (e) => {
e.preventDefault();

if (validateForm()) {
  // Send the complete form data including confirmPassword as required by the backend
  const registrationData = formData;
  
  try {
    await dispatch(registerUser(registrationData)).unwrap();
    setRegistrationSuccess(true);
  } catch (err) {
    // Error is already handled by the slice
  }
}

};

return (
  <div className="register-bg d-flex align-items-center justify-content-center min-vh-100" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)' }}>
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-10 col-xl-10">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-body p-5">
              <h2 className="text-center mb-4 fw-bold">Create an Account</h2>
              {registrationSuccess ? (
                <div className="alert alert-success" role="alert">
                  Registration successful! You will be redirected to the login page in a moment.
                </div>
              ) : (
                <>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="mt-3">
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Full Name</label>
                      <input
                        type="text"
                        className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        disabled={isLoading}
                      />
                      {validationErrors.name && (
                        <div className="invalid-feedback">{validationErrors.name}</div>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        disabled={isLoading}
                      />
                      {validationErrors.email && (
                        <div className="invalid-feedback">{validationErrors.email}</div>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Password</label>
                      <input
                        type="password"
                        className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        disabled={isLoading}
                      />
                      {validationErrors.password && (
                        <div className="invalid-feedback">{validationErrors.password}</div>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                      <input
                        type="password"
                        className={`form-control ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        disabled={isLoading}
                      />
                      {validationErrors.confirmPassword && (
                        <div className="invalid-feedback">{validationErrors.confirmPassword}</div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label className="form-label d-block">Select Role</label>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="role"
                          id="roleStudent"
                          value="Student"
                          checked={formData.role === 'Student'}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <label className="form-check-label" htmlFor="roleStudent">
                          Student
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="role"
                          id="roleInstructor"
                          value="Instructor"
                          checked={formData.role === 'Instructor'}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <label className="form-check-label" htmlFor="roleInstructor">
                          Instructor
                        </label>
                      </div>
                      {validationErrors.role && (
                        <div className="text-danger small mt-1">{validationErrors.role}</div>
                      )}
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary w-100" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="d-inline-block me-2">
                            <LoadingSpinner size="sm" variant="light" text="" />
                          </div>
                          Processing...
                        </>
                      ) : 'Register'}
                    </button>
                  </form>
                </>
              )}
              <div className="mt-4 text-center">
                <p>Already have an account? <Link to="/login" className="text-decoration-none">Login</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

};

export default RegisterForm;
