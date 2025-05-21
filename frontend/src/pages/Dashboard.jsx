import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useTheme, ThemeToggle } from '../components/providers/ThemeProvider';
import useDashboard from '../hooks/useDashboard';

// Import CSS
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Dashboard.css';

// Import Dashboard Components
import StudentDashboard from '../components/dashboard/StudentDashboard';
import InstructorDashboard from '../components/dashboard/InstructorDashboard';

const Dashboard = () => {
  const { user, role } = useSelector((state) => state.auth);
  const { isDark } = useTheme();
  
  // Use the custom dashboard hook to fetch real API data
  const { isLoading, error, dashboardData, refetch } = useDashboard();
  
  if (isLoading) {
    return (
      <div className="dashboard">
        <LoadingSpinner 
          size="lg" 
          variant="primary" 
          text="Loading your dashboard..." 
          centered 
        />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="dashboard">
        <div className="alert alert-danger my-5" role="alert">
          <h4 className="alert-heading">Error Loading Dashboard</h4>
          <p>{error}</p>
          <hr />
          <button 
            className="btn btn-outline-danger" 
            onClick={() => window.location.reload()}
            aria-label="Try loading the dashboard again"
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section mb-4">
        <div className="card border-0 text-white shadow">
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col">
                <h2 className="mb-1">Welcome back, {user?.name || 'User'}!</h2>
                <p className="mb-0">
                  {role === 'Student' 
                    ? 'Continue your learning journey and track your progress' 
                    : 'Manage your courses and monitor student performance'}
                </p>
              </div>
              <div className="col-auto d-flex align-items-center">
                <ThemeToggle className="me-3" />
                <div className="bg-white text-primary rounded-circle p-3 shadow-sm">
                  <i className="bi bi-mortarboard-fill fs-1" aria-hidden="true"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Content - Role-specific */}
      {role === 'Student' ? (
        <StudentDashboard 
          courses={dashboardData.courses} 
          activities={dashboardData.activities} 
          assessments={dashboardData.assessments} 
        />
      ) : (
        <InstructorDashboard 
          stats={dashboardData.stats} 
          courses={dashboardData.instructorCourses} 
          activities={dashboardData.activities} 
        />
      )}
      
      {/* Refresh Button - Only visible in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4">
          <div className="card border-0 shadow-sm">
              <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">Developer Tools</h2>
                <div>
                  <button 
                    onClick={refetch} 
                    className="btn btn-sm btn-success me-2"
                    aria-label="Refresh dashboard data"
                  >
                    <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
                    Refresh Data
                  </button>
                  <span className="badge bg-warning text-dark">Development Mode</span>
                </div>
              </div>
            <div className="card-body">
              <div className="alert alert-info mb-4" role="alert">
                <div className="d-flex">
                  <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                  <div>
                    <p className="mb-0">
                      These tools are only available in development mode to help with testing and debugging.
                      They will not be visible in production.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Component Libraries Section */}
              <h3 className="h6 mb-3 border-bottom pb-2">Component Libraries</h3>
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="card h-100 border shadow-hover">
                    <div className="card-body">
                      <h5 className="card-title h6">
                        <i className="bi bi-arrow-repeat text-primary me-2"></i>
                        Loading Spinners
                      </h5>
                      <p className="card-text small text-muted">
                        Explore loading spinner variations and configurations.
                      </p>
                    </div>
                    <div className="card-footer bg-light border-top-0 text-end">
                      <Link to="/demo/loading" className="btn btn-sm btn-outline-primary">
                        Open Demo
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card h-100 border shadow-hover">
                    <div className="card-body">
                      <h5 className="card-title h6">
                        <i className="bi bi-palette text-success me-2"></i>
                        Theme Preview
                      </h5>
                      <p className="card-text small text-muted">
                        Preview components in different themes and modes.
                      </p>
                    </div>
                    <div className="card-footer bg-light border-top-0 text-end">
                      <Link to="#" className="btn btn-sm btn-outline-primary" onClick={() => alert('Theme Preview tool coming soon!')}>
                        Open Demo
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card h-100 border shadow-hover">
                    <div className="card-body">
                      <h5 className="card-title h6">
                        <i className="bi bi-grid-3x3-gap text-info me-2"></i>
                        Component Playground
                      </h5>
                      <p className="card-text small text-muted">
                        Experiment with UI components and variations.
                      </p>
                    </div>
                    <div className="card-footer bg-light border-top-0 text-end">
                      <button className="btn btn-sm btn-outline-secondary" disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card h-100 border shadow-hover">
                    <div className="card-body">
                      <h5 className="card-title h6">
                        <i className="bi bi-layout-text-window text-warning me-2"></i>
                        Form Controls
                      </h5>
                      <p className="card-text small text-muted">
                        Interactive form elements and validation examples.
                      </p>
                    </div>
                    <div className="card-footer bg-light border-top-0 text-end">
                      <button className="btn btn-sm btn-outline-secondary" disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Developer Tools Section */}
              <h3 className="h6 mb-3 border-bottom pb-2">Developer Utilities</h3>
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="card h-100 border shadow-hover">
                    <div className="card-body">
                      <h5 className="card-title h6">
                        <i className="bi bi-database text-primary me-2"></i>
                        Mock Data Viewer
                      </h5>
                      <p className="card-text small text-muted">
                        View and edit mock data used in the application.
                      </p>
                    </div>
                    <div className="card-footer bg-light border-top-0 text-end">
                      <button className="btn btn-sm btn-outline-secondary" disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card h-100 border shadow-hover">
                    <div className="card-body">
                      <h5 className="card-title h6">
                        <i className="bi bi-eyeglasses text-success me-2"></i>
                        State Inspector
                      </h5>
                      <p className="card-text small text-muted">
                        Inspect and modify Redux state during development.
                      </p>
                    </div>
                    <div className="card-footer bg-light border-top-0 text-end">
                      <button className="btn btn-sm btn-outline-secondary" disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card h-100 border shadow-hover">
                    <div className="card-body">
                      <h5 className="card-title h6">
                        <i className="bi bi-bug text-danger me-2"></i>
                        Error Simulator
                      </h5>
                      <p className="card-text small text-muted">
                        Simulate errors and test error boundaries.
                      </p>
                    </div>
                    <div className="card-footer bg-light border-top-0 text-end">
                      <button className="btn btn-sm btn-outline-secondary" disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card h-100 border shadow-hover">
                    <div className="card-body">
                      <h5 className="card-title h6">
                        <i className="bi bi-speedometer2 text-info me-2"></i>
                        Performance Monitor
                      </h5>
                      <p className="card-text small text-muted">
                        Monitor and analyze component rendering performance.
                      </p>
                    </div>
                    <div className="card-footer bg-light border-top-0 text-end">
                      <button className="btn btn-sm btn-outline-secondary" disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

Dashboard.propTypes = {
  // No props needed as this component uses redux state
};

export default Dashboard;
