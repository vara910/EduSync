import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../providers/ThemeProvider';

// Import demo styles
import '../../styles/DemoLayout.css';

/**
 * Layout for demo pages with consistent navigation and styling
 * Only used in development mode
 */
const DemoLayout = ({ children, title }) => {
  const location = useLocation();
  
  // Check if we're in a specific demo page
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Demo pages
  const demoPages = [
    { path: '/demo/loading', name: 'Loading Spinners', icon: 'arrow-repeat' },
    { path: '/demo/theme', name: 'Theme Preview', icon: 'palette', disabled: true },
    { path: '/demo/components', name: 'Component Library', icon: 'grid-3x3-gap', disabled: true },
    { path: '/demo/forms', name: 'Form Controls', icon: 'layout-text-window', disabled: true },
  ];

  return (
    <div className="demo-layout">
      {/* Development Mode Banner */}
      <div className="dev-mode-banner">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <span className="badge bg-warning text-dark me-2">DEV MODE</span>
            <small className="text-muted">These pages are only visible in development mode</small>
          </div>
          <Link to="/dashboard" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i>
            Back to App
          </Link>
        </div>
      </div>

      {/* Demo Header */}
      <header className="demo-header">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-0">EduSync Dev Tools</h1>
              <p className="mb-0 text-light">Component demos and development utilities</p>
            </div>
            <ThemeToggle showLabel />
          </div>
        </div>
      </header>
      
      <div className="container pb-5">
        <div className="row">
          {/* Demo Navigation Sidebar */}
          <div className="col-md-3 mb-4">
            <div className="card border-0 shadow-sm demo-nav">
              <div className="card-header bg-light">
                <h2 className="h6 mb-0">Demo Navigation</h2>
              </div>
              <div className="list-group list-group-flush">
                {demoPages.map((page, index) => (
                  <Link
                    key={index}
                    to={page.disabled ? '#' : page.path}
                    className={`list-group-item list-group-item-action d-flex align-items-center 
                      ${isActive(page.path) ? 'active' : ''} 
                      ${page.disabled ? 'disabled text-muted' : ''}`}
                    aria-disabled={page.disabled}
                    onClick={page.disabled ? (e) => e.preventDefault() : undefined}
                  >
                    <i className={`bi bi-${page.icon} me-2`}></i>
                    {page.name}
                    {page.disabled && <span className="badge bg-secondary ms-auto">Soon</span>}
                  </Link>
                ))}
                <Link to="/dashboard" className="list-group-item list-group-item-action d-flex align-items-center text-primary">
                  <i className="bi bi-house-door me-2"></i>
                  Back to Dashboard
                </Link>
              </div>
            </div>
            
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-body">
                <h3 className="h6 mb-3">Environment Info</h3>
                <div className="mb-2 d-flex justify-content-between">
                  <span className="text-muted">Node Env:</span>
                  <span className="badge bg-info">{process.env.NODE_ENV}</span>
                </div>
                <div className="mb-2 d-flex justify-content-between">
                  <span className="text-muted">React Version:</span>
                  <span className="badge bg-secondary">{React.version}</span>
                </div>
                <div className="mb-0 d-flex justify-content-between">
                  <span className="text-muted">Build:</span>
                  <span className="badge bg-secondary">Dev</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Demo Content */}
          <div className="col-md-9">
            {/* Breadcrumb Navigation */}
            <nav aria-label="breadcrumb" className="mb-3">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><Link to="/dashboard">Dashboard</Link></li>
                <li className="breadcrumb-item"><Link to="/demo">Developer Tools</Link></li>
                <li className="breadcrumb-item active" aria-current="page">{title}</li>
              </ol>
            </nav>
            
            {/* Main Demo Content Card */}
            <div className="card border-0 shadow-sm demo-card mb-4">
              <div className="card-header demo-card-header d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">{title}</h2>
                <div>
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => window.location.reload()}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </button>
                  <Link to="/demo" className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-grid-3x3-gap me-1"></i>
                    All Demos
                  </Link>
                </div>
              </div>
              
              {/* Demo Description Section */}
              <div className="card-body border-bottom pb-4">
                <div className="demo-description mb-4">
                  <h3 className="h6 text-muted mb-3">About This Demo</h3>
                  <p>
                    This demo page showcases components and functionality for the EduSync application.
                    Use the controls to customize component properties and see the results in real-time.
                  </p>
                </div>
                
                {/* Main Demo Content */}
                <div className="demo-content">
                  {children}
                </div>
              </div>
              
              {/* Demo Navigation Footer */}
              <div className="card-footer bg-light">
                <div className="d-flex justify-content-between">
                  <div>
                    <Link 
                      to="/demo" 
                      className="btn btn-sm btn-outline-secondary"
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Back to All Demos
                    </Link>
                  </div>
                  <div className="demo-actions">
                    {/* Next/Previous Demo Navigation */}
                    {getPreviousDemo() && (
                      <Link 
                        to={getPreviousDemo()?.path || '#'} 
                        className={`btn btn-sm btn-outline-primary ${getPreviousDemo()?.disabled ? 'disabled' : ''}`}
                      >
                        <i className="bi bi-arrow-left me-1"></i>
                        Previous Demo
                      </Link>
                    )}
                    {getNextDemo() && (
                      <Link 
                        to={getNextDemo()?.path || '#'} 
                        className={`btn btn-sm btn-outline-primary ms-2 ${getNextDemo()?.disabled ? 'disabled' : ''}`}
                      >
                        Next Demo
                        <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Helper functions to get next and previous demos
  function getNextDemo() {
    const currentIndex = demoPages.findIndex(page => isActive(page.path));
    if (currentIndex === -1 || currentIndex >= demoPages.length - 1) return null;
    return demoPages[currentIndex + 1];
  }
  
  function getPreviousDemo() {
    const currentIndex = demoPages.findIndex(page => isActive(page.path));
    if (currentIndex <= 0) return null;
    return demoPages[currentIndex - 1];
  }
};

DemoLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
};

export default DemoLayout;

