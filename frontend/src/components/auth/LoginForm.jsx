import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, clearError } from '../../features/authSlice';
import LoadingSpinner from '../common/LoadingSpinner';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  
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
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      dispatch(loginUser(formData));
    }
  };
  
  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-10">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Login to EduSync</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
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
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  {validationErrors.password && (
                    <div className="invalid-feedback">{validationErrors.password}</div>
                  )}
                </div>
                
                <div className="mb-3 form-check">
                  <input type="checkbox" className="form-check-input" id="rememberMe" />
                  <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
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
                  ) : 'Login'}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <p>Don't have an account? <Link to="/register" className="text-decoration-none">Register</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

