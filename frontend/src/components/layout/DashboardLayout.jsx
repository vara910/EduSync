import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Dropdown, Badge, Toast, ToastContainer, Breadcrumb, Button, Alert, Spinner } from 'react-bootstrap';
import { logout } from '../../features/authSlice';
import { 
  fetchStudentDashboardData, 
  fetchInstructorDashboardData, 
  refreshDashboard,
  clearErrors
} from '../../features/dashboard/dashboardSlice';
import { ErrorBoundary } from 'react-error-boundary';
import axios from 'axios';
import '../../styles/Dashboard.css';

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-boundary-container p-4 text-center">
    <Alert variant="danger">
      <Alert.Heading>Something went wrong!</Alert.Heading>
      <p>{error.message || 'An unexpected error occurred in the dashboard.'}</p>
      <div className="mt-3">
        <Button variant="outline-danger" onClick={resetErrorBoundary}>
          Try Again
        </Button>
      </div>
    </Alert>
  </div>
);

// Loading indicator component
const LoadingIndicator = ({ message = "Loading..." }) => (
  <div className="loading-container d-flex flex-column justify-content-center align-items-center p-4">
    <Spinner animation="border" role="status" variant="primary" />
    <p className="mt-2">{message}</p>
  </div>
);

const DashboardLayout = ({ children }) => {
  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Course Available', message: 'Check out our new Machine Learning course!', time: '5 min ago', read: false },
    { id: 2, title: 'Assessment Reminder', message: 'You have an assessment due tomorrow', time: '2 hours ago', read: false },
    { id: 3, title: 'Course Progress Update', message: 'You\'ve completed 75% of Web Development', time: '1 day ago', read: true }
  ]);
  const [systemStatus, setSystemStatus] = useState({
    status: 'online',
    message: 'All systems operational',
    lastChecked: new Date().toLocaleTimeString()
  });

  // Redux
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  const role = user?.role || 'Student';
  const isInstructor = role === 'Instructor';
  const {
    enrolledCourses = [],
    studentResults = [],
    instructorCourses = [],
    assessmentSummaries = [],
    studentDashboard,
    instructorDashboard,
    error: dashboardError
  } = useSelector((state) => state.dashboard || {});

  // Debug logging for authentication and dashboard state
  console.log('Auth:', { isAuthenticated, token, user });
  console.log('Dashboard:', {
    enrolledCourses,
    studentResults,
    instructorCourses,
    assessmentSummaries,
    studentDashboard,
    instructorDashboard,
    dashboardError
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for authentication and redirect if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated || !token) {
        console.log('User not authenticated, redirecting to login');
        await dispatch(clearErrors());
        navigate('/login', { replace: true });
      }
    };
    checkAuth();
  }, [isAuthenticated, token, navigate, dispatch]);

  // Utilities and handlers
  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    try {
      // Clear any pending requests
      const source = axios.CancelToken.source();
      source.cancel('User logged out');
      
      // Clear all errors before logout
      dispatch(clearErrors());
      
      // Dispatch logout action
      dispatch(logout());
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force navigation even if logout fails
      navigate('/login');
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  // Safe data access helper
  const safeAccess = (obj, path, defaultValue = 0) => {
    try {
      return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? defaultValue;
    } catch (e) {
      console.error('Error accessing path:', path, e);
      return defaultValue;
    }
  };

  // Move these functions above getDashboardStats to avoid ReferenceError
  const getTotalStudents = useCallback(() => {
    if (!instructorCourses) return 0;
    try {
      const uniqueStudents = new Set();
      instructorCourses.forEach(course => {
        (course.enrollments || []).forEach(enrollment => {
          if (enrollment && enrollment.studentId) {
            uniqueStudents.add(enrollment.studentId);
          }
        });
      });
      return uniqueStudents.size;
    } catch (error) {
      console.error('Error calculating total students:', error);
      return 0;
    }
  }, [instructorCourses]);

  const getCompletedCourses = useCallback(() => {
    try {
      if (!enrolledCourses || !Array.isArray(enrolledCourses)) return 0;
      return enrolledCourses.filter(course => (course?.progress || 0) >= 100).length;
    } catch (error) {
      console.error('Error calculating completed courses:', error);
      return 0;
    }
  }, [enrolledCourses]);

  const getInProgressCourses = useCallback(() => {
    try {
      if (!enrolledCourses || !Array.isArray(enrolledCourses)) return 0;
      return enrolledCourses.filter(course => (course?.progress || 0) < 100).length;
    } catch (error) {
      console.error('Error calculating in-progress courses:', error);
      return 0;
    }
  }, [enrolledCourses]);

  const getAverageScore = useCallback(() => {
    try {
      if (isInstructor) {
        if (!assessmentSummaries || !Array.isArray(assessmentSummaries) || assessmentSummaries.length === 0) return 0;

        const validSummaries = assessmentSummaries.filter(summary =>
          summary && typeof summary.averageScore === 'number'
        );

        if (validSummaries.length === 0) return 0;

        const totalAverage = validSummaries.reduce((sum, summary) =>
          sum + (summary.averageScore || 0), 0);

        return Math.round(totalAverage / validSummaries.length);
      } else {
        // Student: calculate average score from studentResults
        if (!studentResults || !Array.isArray(studentResults) || studentResults.length === 0) return 0;

        const validResults = studentResults.filter(result =>
          result && typeof result.score === 'number'
        );

        if (validResults.length === 0) return 0;

        const totalScore = validResults.reduce((sum, result) =>
          sum + (result.score || 0), 0);

        return Math.round(totalScore / validResults.length);
      }
    } catch (error) {
      console.error('Error calculating average score:', error);
      return 0;
    }
  }, [isInstructor, assessmentSummaries, studentResults]);

  // Now getDashboardStats can safely use the above functions
  const getDashboardStats = useCallback(() => {
    if (isInstructor) {
      return [
        { title: 'Courses Created', value: instructorCourses?.length || 0 },
        { title: 'Total Students', value: getTotalStudents() },
        { title: 'Total Assessments', value: assessmentSummaries?.length || 0 },
        { title: 'Average Score', value: getAverageScore() + '%' }
      ];
    }
    return [
      { title: 'Courses Enrolled', value: enrolledCourses?.length || 0 },
      { title: 'Completed', value: getCompletedCourses() },
      { title: 'In Progress', value: getInProgressCourses() },
      { title: 'Average Score', value: getAverageScore() + '%' }
    ];
  }, [isInstructor, instructorCourses, enrolledCourses, assessmentSummaries, getTotalStudents, getCompletedCourses, getInProgressCourses, getAverageScore]);

  // Check if data is ready to display stats
  const shouldShowStats = useCallback(() => {
    if (isInstructor) {
      return instructorCourses !== null && assessmentSummaries !== null;
    }
    return enrolledCourses !== null && studentResults !== null;
  }, [isInstructor, instructorCourses, assessmentSummaries, enrolledCourses, studentResults]);

  // Move getBreadcrumbs above its usage
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(x => x);
    if (paths.length === 0) return [{ label: 'Home', path: '/' }];
    const breadcrumbs = [{ label: 'Home', path: '/' }];
    let currentPath = '';
    paths.forEach(path => {
      currentPath += `/${path}`;
      breadcrumbs.push({
        label: path.charAt(0).toUpperCase() + path.slice(1),
        path: currentPath
      });
    });
    return breadcrumbs;
  };

  // Side Effects
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth < 992) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize data fetching with error handling
  const fetchDashboardData = useCallback(async () => {
    if (!token || !isAuthenticated) {
      console.log('No token or not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (isLoading) {
      console.log('Already loading data, skipping fetch');
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    
    try {
      await dispatch(clearErrors());
      const result = await (isInstructor 
        ? dispatch(fetchInstructorDashboardData()).unwrap()
        : dispatch(fetchStudentDashboardData()).unwrap()
      );
      
      console.log('Dashboard data loaded successfully');
      setIsLoading(false);
      
      // Update system status to reflect successful load
      setSystemStatus({
        status: 'online',
        message: 'All systems operational',
        lastChecked: new Date().toLocaleTimeString()
      });
      
      return result;
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setHasError(true);
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        'Failed to load dashboard data'
      );
      setIsLoading(false);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.log('Session expired, logging out');
        handleLogout();
      } else if (error.response?.status === 500) {
        setSystemStatus({
          status: 'error',
          message: 'Server error encountered',
          lastChecked: new Date().toLocaleTimeString()
        });
      } else {
        // For other errors
        setSystemStatus({
          status: 'error',
          message: 'System components unavailable',
          lastChecked: new Date().toLocaleTimeString()
        });
      }
      
      throw error;
    }
  }, [dispatch, isInstructor, token, isAuthenticated, isLoading, handleLogout, navigate]);

  // Load dashboard data based on role
  useEffect(() => {
    if (isAuthenticated && token) {
      // Wrap in a try-catch to prevent unhandled promise rejections
      const loadData = async () => {
        try {
          await fetchDashboardData();
        } catch (error) {
          console.error('Initial dashboard load failed:', error);
          // Error is already handled in fetchDashboardData
        }
      };
      
      loadData();
    }
  }, [fetchDashboardData, isAuthenticated, token]);
  
  // Error handling
  useEffect(() => {
    if (dashboardError) {
      setHasError(true);
      setErrorMessage(dashboardError);
      
      // Update system status
      setSystemStatus({
        status: 'error',
        message: 'System encountered an error',
        lastChecked: new Date().toLocaleTimeString()
      });
    }
  }, [dashboardError]);
  
  // Auto retry on error with exponential backoff
  useEffect(() => {
    let retryTimer;
    
    if (hasError && retryCount < 3) {
      // Use exponential backoff for retries (1s, 2s, 4s)
      const backoffTime = Math.pow(2, retryCount) * 1000;
      
      retryTimer = setTimeout(async () => {
        console.log(`Retrying dashboard data fetch (${retryCount + 1}/3) after ${backoffTime}ms...`);
        try {
          await dispatch(clearErrors());
          setRetryCount(prev => prev + 1);
          await fetchDashboardData();
        } catch (error) {
          console.error('Retry failed:', error);
          
          // If we've reached max retries, show a more helpful error message
          if (retryCount === 2) {
            setErrorMessage(
              'Unable to load dashboard after multiple attempts. Please check your connection and try again later.'
            );
          }
        }
      }, backoffTime);
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [hasError, retryCount, dispatch, fetchDashboardData]);

  // Check system status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        lastChecked: new Date().toLocaleTimeString()
      }));
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <Navbar bg="primary" variant="dark" expand="lg" className="navbar-top" fixed="top">
        <Container fluid>
          <Button 
            variant="outline-light" 
            className="me-2 d-lg-none" 
            onClick={toggleSidebar}
          >
            <i className={`bi ${isSidebarOpen ? 'bi-x' : 'bi-list'}`}></i>
          </Button>
          
          <Navbar.Brand as={Link} to="/dashboard">
            <img 
              src="/logo.svg" 
              alt="EduSync" 
              height="30" 
              className="d-inline-block align-top me-2"
            />
            EduSync
          </Navbar.Brand>
          
          <div className="ms-auto d-flex align-items-center">
            {/* Notifications */}
            <div className="position-relative me-3">
              <Button 
                variant="outline-light" 
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="bi bi-bell"></i>
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge pill bg="danger" className="notification-badge">
                    {notifications.filter(n => !n.read).length}
                  </Badge>
                )}
              </Button>
              
              <ToastContainer className="notifications-dropdown p-0" position="top-end">
                <div 
                  className="notifications-container"
                  style={{ 
                    display: showNotifications ? 'block' : 'none',
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 1050,
                    background: 'white',
                    boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
                    borderRadius: '0.25rem'
                  }}
                >
                  <div className="p-2 border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Notifications</h6>
                    {notifications.some(n => !n.read) && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 text-decoration-none"
                        onClick={markAllNotificationsAsRead}
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  
                  {notifications.length > 0 ? notifications.map(notification => (
                    <Toast 
                      key={notification.id} 
                      onClose={() => removeNotification(notification.id)}
                      className={notification.read ? 'bg-light' : ''}
                    >
                      <Toast.Header>
                        <strong className="me-auto">{notification.title}</strong>
                        <small>{notification.time}</small>
                      </Toast.Header>
                      <Toast.Body>
                        {notification.message}
                      </Toast.Body>
                    </Toast>
                  )) : (
                    <div className="p-3 text-center text-muted">
                      No notifications
                    </div>
                  )}
                </div>
              </ToastContainer>
            </div>
            
            {/* User Profile */}
            <Dropdown align="end">
              <Dropdown.Toggle 
                variant="outline-light" 
                id="user-dropdown" 
                className="user-dropdown d-flex align-items-center"
              >
                <div className="avatar bg-light text-primary rounded-circle d-flex justify-content-center align-items-center me-2"
                     style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="d-none d-md-inline">{user?.name || 'User'}</span>
              </Dropdown.Toggle>
              
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/profile">
                  <i className="bi bi-person me-2"></i> Profile
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/settings">
                  <i className="bi bi-gear me-2"></i> Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>
      
      {/* Sidebar */}
      <div className={`sidebar bg-dark text-white ${isSidebarOpen ? 'open' : 'closed'}`} 
           style={{ 
             width: isSidebarOpen ? '250px' : '0', 
             position: 'fixed',
             height: '100%',
             zIndex: 1000,
             top: '56px',
             left: 0,
             overflowX: 'hidden',
             transition: 'all 0.3s ease-in-out',
           }}>
        <div className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">Navigation</h5>
            {isMobile && (
              <button 
                className="btn btn-sm btn-outline-light" 
                onClick={toggleSidebar}
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
          
          <div className="user-info mb-4">
            <div className="d-flex align-items-center">
              <div className="avatar bg-primary rounded-circle d-flex justify-content-center align-items-center me-2" 
                   style={{ width: '40px', height: '40px' }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h6 className="mb-0">{user?.name || 'User'}</h6>
                <small className="text-muted">{role || 'User'}</small>
              </div>
            </div>
          </div>
          
          <nav className="nav flex-column">
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard') ? 'active bg-primary' : ''}`}
            >
              <i className="bi bi-speedometer2 me-2"></i> Dashboard
            </Link>
            
            <Link 
              to="/courses" 
              className={`nav-link ${isActive('/courses') ? 'active bg-primary' : ''}`}
            >
              <i className="bi bi-book me-2"></i> Courses
            </Link>
            
            <Link 
              to="/assessment" 
              className={`nav-link ${isActive('/assessment') ? 'active bg-primary' : ''}`}
            >
              <i className="bi bi-clipboard-check me-2"></i> Assessments
            </Link>

            {/* Role-specific navigation items */}
            {role === 'Instructor' && (
              <>
                <div className="nav-section mt-3 mb-2">
                  <small className="text-uppercase text-muted">Instructor</small>
                </div>
                
                <Link 
                  to="/course-management" 
                  className={`nav-link ${isActive('/course-management') ? 'active bg-primary' : ''}`}
                >
                  <i className="bi bi-pencil-square me-2"></i> Course Management
                </Link>
                
                <Link 
                  to="/student-progress" 
                  className={`nav-link ${isActive('/student-progress') ? 'active bg-primary' : ''}`}
                >
                  <i className="bi bi-graph-up me-2"></i> Student Progress
                </Link>
              </>
            )}
            
            <div className="nav-section mt-3 mb-2">
              <small className="text-uppercase text-muted">Account</small>
            </div>
            
            <Link 
              to="/profile" 
              className={`nav-link ${isActive('/profile') ? 'active bg-primary' : ''}`}
            >
              <i className="bi bi-person me-2"></i> Profile
            </Link>
            
            <Link 
              to="/settings" 
              className={`nav-link ${isActive('/settings') ? 'active bg-primary' : ''}`}
            >
              <i className="bi bi-gear me-2"></i> Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ 
        marginLeft: isSidebarOpen ? '250px' : '0', 
        transition: 'all 0.3s ease-in-out',
        width: isSidebarOpen ? 'calc(100% - 250px)' : '100%',
        paddingTop: '56px', // Account for fixed navbar
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Mobile Sidebar Toggle */}
        {isMobile && !isSidebarOpen && (
          <button 
            className="btn btn-primary sidebar-toggle m-3" 
            onClick={toggleSidebar}
            style={{ position: 'fixed', zIndex: 999 }}
          >
            <i className="bi bi-list"></i>
          </button>
        )}
        
        {/* Breadcrumbs */}
        <div className="breadcrumb-container bg-light px-4 py-2 mb-2 border-bottom">
          <Breadcrumb>
            {getBreadcrumbs().map((item, index) => (
              <Breadcrumb.Item 
                key={index} 
                linkAs={Link} 
                linkProps={{ to: item.path }}
                active={index === getBreadcrumbs().length - 1}
              >
                {item.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>

        {/* Quick Stats Section - Only show when data is ready */}
        {shouldShowStats() ? (
          <div className="quick-stats bg-light p-3 mb-4">
            <div className="container-fluid">
              <div className="row g-3">
                {getDashboardStats().map((stat, index) => (
                  <div key={index} className="col-md-3 col-sm-6">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title text-muted">{stat.title}</h6>
                        <h3 className="card-text">{stat.value}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !isLoading && !hasError ? (
          <div className="alert alert-info mx-3">
            <i className="bi bi-info-circle me-2"></i>
            Loading dashboard statistics...
          </div>
        ) : null}

        {/* System Status */}
        <div className="system-status px-4 mb-3">
          <small className="d-flex align-items-center">
            <span 
              className={`status-indicator ${systemStatus.status === 'online' ? 'bg-success' : 'bg-danger'}`} 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                display: 'inline-block', 
                marginRight: '6px' 
              }}
            ></span>
            <span className="text-muted me-2">{systemStatus.message}</span>
            <span className="text-muted ms-auto">Last checked: {systemStatus.lastChecked}</span>
          </small>
        </div>
        
        {/* Main Content */}
        <div className="content-wrapper flex-grow-1 px-4 py-3">
          <ErrorBoundary 
            FallbackComponent={ErrorFallback}
            onReset={() => {
              dispatch(clearErrors());
              fetchDashboardData();
            }}
          >
            <Suspense fallback={<LoadingIndicator message="Loading content..." />}>
              {isLoading ? (
                <LoadingIndicator message="Loading dashboard data..." />
              ) : hasError ? (
                <Alert variant="danger" className="m-3">
                  <Alert.Heading>Error Loading Dashboard</Alert.Heading>
                  <p>{errorMessage}</p>
                  <div className="d-flex justify-content-end">
                    <Button 
                      variant="outline-danger" 
                      onClick={() => {
                        dispatch(clearErrors());
                        fetchDashboardData();
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                </Alert>
              ) : (
                children
              )}
            </Suspense>
          </ErrorBoundary>
        </div>
        
        {/* Footer */}
        <footer className="footer bg-light py-3 border-top mt-auto">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">© 2025 EduSync. All rights reserved.</small>
              </div>
              <div>
                <small className="text-muted">Version 1.0.0</small>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;