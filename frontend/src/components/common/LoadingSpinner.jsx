import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../providers/ThemeProvider';

/**
 * LoadingSpinner component for displaying loading states throughout the application
 * 
 * @component
 * @example
 * // Basic usage
 * <LoadingSpinner />
 * 
 * // With text and different size/variant
 * <LoadingSpinner 
 *   size="lg" 
 *   variant="secondary" 
 *   text="Loading courses..." 
 *   centered 
 * />
 * 
 * // As overlay
 * <LoadingSpinner overlay />
 */
const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  text = 'Loading...', 
  centered = false,
  overlay = false,
  show = true,
  fadeOut = false,
  fadeOutDelay = 300,
  dotStyle = false
}) => {
  // State for handling fade-out animation
  const [isVisible, setIsVisible] = useState(show);
  
  // Get theme context
  const { isDark } = useTheme();
  
  // Handle show/hide with fade animation
  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else if (fadeOut) {
      // Allow time for fade-out animation
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, fadeOutDelay);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, fadeOut, fadeOutDelay]);
  
  // Early return if not visible
  if (!isVisible) return null;

  // Size classes
  const sizeClasses = {
    sm: 'spinner-sm',
    md: '',
    lg: 'spinner-lg'
  };

  // Variant classes and colors
  const variantClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
    light: 'text-light',
    dark: 'text-dark'
  };

  // Size dimensions
  const sizeDimensions = {
    sm: '1rem',
    md: '2rem',
    lg: '3rem'
  };

  // Adjust variant for dark mode to ensure contrast
  let adjustedVariant = variant;
  if (isDark && variant === 'dark') {
    adjustedVariant = 'light'; // Switch dark to light in dark mode for better contrast
  } else if (isDark && variant === 'light') {
    adjustedVariant = 'secondary'; // Make light variant more visible in dark mode
  }
  
  // Use dot style if specified
  const spinnerType = dotStyle ? 'dots' : 'border';

  // Base spinner component
  const spinner = (
    <div className="d-flex flex-column align-items-center">
      <div 
        className={`spinner-border ${sizeClasses[size]} ${variantClasses[adjustedVariant]}`} 
        style={{ width: sizeDimensions[size], height: sizeDimensions[size] }}
        role="status"
        aria-hidden="true"
      />
      {text && (
        <p className={`mt-2 ${variantClasses[adjustedVariant]}`} aria-live="polite">
          {text}
        </p>
      )}
      <span className="sr-only visually-hidden">Loading content</span>
    </div>
  );

  // Dots spinner variant using the animation from index.css
  const dotsSpinner = (
    <div className="d-flex flex-column align-items-center">
      <div className="loader-dots" role="status" aria-hidden="true">
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && (
        <p className={`mt-2 ${variantClasses[adjustedVariant]}`} aria-live="polite">
          {text}
        </p>
      )}
      <span className="sr-only visually-hidden">Loading content</span>
    </div>
  );

  // Decide which spinner to use
  const spinnerContent = spinnerType === 'dots' ? dotsSpinner : spinner;
  // For full page overlay loading
  if (overlay) {
    // Classes for fade animation
    const animationClass = show ? 'animate-fadeIn' : 'animate-fadeOut';
    
    return (
      <div 
        className={`position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center ${animationClass}`}
        style={{ 
          backgroundColor: isDark 
            ? 'rgba(33, 37, 41, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)', 
          zIndex: 1050,
          backdropFilter: 'blur(5px)',
          transition: 'opacity 0.3s ease-in-out'
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Loading content, please wait"
      >
        <div className="animate-fadeIn">
          {spinnerContent}
        </div>
      </div>
    );
  }

  // For regular centered or inline loading
  if (centered) {
    // Classes for fade animation
    const animationClass = show ? 'animate-fadeIn' : 'animate-fadeOut';
    
    return (
      <div className={`d-flex justify-content-center my-4 ${animationClass}`}>
        {spinnerContent}
      </div>
    );
  }
  
  // Default inline loading
  // Classes for fade animation
  const animationClass = show ? 'animate-fadeIn' : 'animate-fadeOut';
  
  return <div className={animationClass}>{spinnerContent}</div>;
};

LoadingSpinner.propTypes = {
  /** Size of the spinner (sm, md, lg) */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),

  /** Color variant of the spinner */
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'success',
    'danger',
    'warning',
    'info',
    'light',
    'dark',
    'dots'
  ]),

  /** Optional text to display below the spinner */
  text: PropTypes.string,

  /** Whether to center the spinner horizontally */
  centered: PropTypes.bool,

  /** Whether to show as full page overlay */
  overlay: PropTypes.bool,

  /** Whether to show the spinner */
  show: PropTypes.bool,
  
  /** Whether to use fade-out animation when hiding */
  fadeOut: PropTypes.bool,
  
  /** Delay in ms before removing from DOM after fade-out starts */
  fadeOutDelay: PropTypes.number,
  
  /** Whether to use dot style spinner instead of border spinner */
  dotStyle: PropTypes.bool
};

export default LoadingSpinner;

