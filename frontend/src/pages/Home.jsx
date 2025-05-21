import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Home page component
 * Serves as the landing page for unauthenticated users
 */
const HomePage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section py-5 bg-primary text-white text-center">
        <div className="container py-5">
          <h1 className="display-4 fw-bold mb-4">Welcome to EduSync</h1>
          <p className="lead mb-4">
            Smart Learning Management & Assessment Platform
          </p>
          <p className="mb-5 w-75 mx-auto">
            A centralized system to manage educational content, 
            monitor performance, and automate assessments in the digital learning era.
          </p>
          <div className="d-flex justify-content-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-light btn-lg px-4 shadow">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-light btn-lg px-4 shadow">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-outline-light btn-lg px-4">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <div className="container">
          <h2 className="text-center mb-5">Key Features</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="feature-icon bg-primary bg-gradient text-white rounded-circle mb-4 mx-auto d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-book fs-1"></i>
                  </div>
                  <h3 className="card-title h5">Course Management</h3>
                  <p className="card-text text-muted">
                    Create, publish, and manage educational content with ease.
                    Students can browse and access courses from anywhere.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="feature-icon bg-success bg-gradient text-white rounded-circle mb-4 mx-auto d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-clipboard-check fs-1"></i>
                  </div>
                  <h3 className="card-title h5">Assessment System</h3>
                  <p className="card-text text-muted">
                    Create tests, quizzes, and assignments with automated grading.
                    Track student progress in real-time.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="feature-icon bg-info bg-gradient text-white rounded-circle mb-4 mx-auto d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-graph-up fs-1"></i>
                  </div>
                  <h3 className="card-title h5">Performance Analytics</h3>
                  <p className="card-text text-muted">
                    Visualize student performance with detailed analytics.
                    Identify trends and improve educational outcomes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">How It Works</h2>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="steps d-flex flex-column">
                <div className="step d-flex mb-4">
                  <div className="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px', flexShrink: 0 }}>
                    <span className="fw-bold">1</span>
                  </div>
                  <div>
                    <h3 className="h5">Register for an Account</h3>
                    <p className="text-muted">Create a student or instructor account to get started.</p>
                  </div>
                </div>
                <div className="step d-flex mb-4">
                  <div className="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px', flexShrink: 0 }}>
                    <span className="fw-bold">2</span>
                  </div>
                  <div>
                    <h3 className="h5">Enroll in Courses</h3>
                    <p className="text-muted">Browse available courses and enroll to start learning.</p>
                  </div>
                </div>
                <div className="step d-flex mb-4">
                  <div className="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px', flexShrink: 0 }}>
                    <span className="fw-bold">3</span>
                  </div>
                  <div>
                    <h3 className="h5">Learn and Complete Assessments</h3>
                    <p className="text-muted">Access course materials and complete assessments to track your progress.</p>
                  </div>
                </div>
                <div className="step d-flex">
                  <div className="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px', flexShrink: 0 }}>
                    <span className="fw-bold">4</span>
                  </div>
                  <div>
                    <h3 className="h5">Track Your Progress</h3>
                    <p className="text-muted">View your performance analytics and improve your learning outcomes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta py-5 bg-primary text-white text-center">
        <div className="container py-4">
          <h2 className="mb-4">Ready to Get Started?</h2>
          <p className="lead mb-4">Join thousands of students and instructors already using EduSync.</p>
          <div className="d-flex justify-content-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-light btn-lg px-4 shadow">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-light btn-lg px-4 shadow">
                  Create an Account
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg px-4">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer py-4 bg-dark text-white">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start">
              <h4 className="mb-0">EduSync</h4>
              <p className="small mb-0">© 2025 EduSync. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-center text-md-end mt-3 mt-md-0">
              <a href="#" className="text-white text-decoration-none me-3">Privacy Policy</a>
              <a href="#" className="text-white text-decoration-none me-3">Terms of Service</a>
              <a href="#" className="text-white text-decoration-none">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

