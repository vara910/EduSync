import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './App.css';

// Layout Components
import Header from './components/layout/Header';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

// Page Components (these will be created next)
import HomePage from './pages/Home';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Assessment from './pages/Assessment';

// Demo Pages (for development)
import LoadingDemo from './pages/LoadingDemo';

// Demo Layout
import DemoLayout from './components/layout/DemoLayout';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  return (
    <div className="app-container">
      <Header />
      <main className="container-fluid py-3">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterForm />
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/courses" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Courses />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/assessment" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Assessment />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Instructor Only Routes */}
          <Route path="/course-management" element={
            <ProtectedRoute allowedRoles={['Instructor']}>
              <DashboardLayout>
                <div>Course Management</div>
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Development Demo Routes */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <Route path="/demo/loading" element={
                <ProtectedRoute>
                  <DemoLayout title="Loading Spinner Demo">
                    <LoadingDemo />
                  </DemoLayout>
                </ProtectedRoute>
              } />
              
              {/* Placeholder routes for upcoming demos */}
              <Route path="/demo/theme" element={
                <ProtectedRoute>
                  <DemoLayout title="Theme Preview Demo">
                    <div className="text-center py-5">
                      <i className="bi bi-tools fs-1 text-muted mb-3"></i>
                      <h3>Coming Soon</h3>
                      <p className="text-muted">The Theme Preview demo is currently under development.</p>
                    </div>
                  </DemoLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/demo" element={
                <ProtectedRoute>
                  <DemoLayout title="Developer Tools">
                    <div className="text-center py-3">
                      <h3>EduSync Developer Tools</h3>
                      <p className="text-muted mb-4">Select a demo from the sidebar to explore available components and utilities.</p>
                      <div className="row g-4">
                        <div className="col-md-4">
                          <div className="card border shadow-hover h-100">
                            <div className="card-body text-center p-4">
                              <i className="bi bi-arrow-repeat text-primary fs-1 mb-3"></i>
                              <h4 className="h5">Loading Spinners</h4>
                              <p className="mb-3">View and customize loading indicators</p>
                              <Link to="/demo/loading" className="btn btn-sm btn-primary">
                                Explore
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="card border shadow-hover h-100">
                            <div className="card-body text-center p-4">
                              <i className="bi bi-palette text-success fs-1 mb-3"></i>
                              <h4 className="h5">Theme Preview</h4>
                              <p className="mb-3">Preview different theme configurations</p>
                              <button className="btn btn-sm btn-secondary" disabled>
                                Coming Soon
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="card border shadow-hover h-100">
                            <div className="card-body text-center p-4">
                              <i className="bi bi-bug text-danger fs-1 mb-3"></i>
                              <h4 className="h5">Error Testing</h4>
                              <p className="mb-3">Test error boundaries and fallbacks</p>
                              <button className="btn btn-sm btn-secondary" disabled>
                                Coming Soon
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DemoLayout>
                </ProtectedRoute>
              } />
            </>
          )}

          {/* 404 Route */}
          <Route path="*" element={<div className="text-center mt-5">
            <h2>404 - Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
          </div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
