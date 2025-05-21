import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    this.setState({ errorInfo });
    console.error('EduSync error:', error, errorInfo);
    
    // Here you would typically log to a service like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }

  handleReset = () => {
    // Clear the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Reload the application
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary-container" data-theme="light">
          <div className="container py-5">
            <div className="row justify-content-center">
              <div className="col-md-8 col-lg-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-5 text-center">
                    <div className="mb-4">
                      <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h1 className="h3 mb-3">Something went wrong</h1>
                    <p className="text-muted mb-4">
                      We're sorry, but an unexpected error has occurred. Our team has been notified and is working to fix the issue.
                    </p>
                    
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                      <div className="alert alert-danger text-start mb-4" role="alert">
                        <details>
                          <summary className="fw-bold mb-2">Error Details</summary>
                          <p>{this.state.error.toString()}</p>
                          {this.state.errorInfo && (
                            <pre className="mt-2 p-3 bg-light rounded overflow-auto" style={{ maxHeight: '200px', fontSize: '0.8rem' }}>
                              {this.state.errorInfo.componentStack}
                            </pre>
                          )}
                        </details>
                      </div>
                    )}
                    
                    <div className="d-grid gap-2">
                      <button 
                        className="btn btn-primary" 
                        onClick={this.handleReset}
                        aria-label="Reload the application"
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Reload Application
                      </button>
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => window.history.go(-1)}
                        aria-label="Go back to previous page"
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Go Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render children if there's no error
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;

