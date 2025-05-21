import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Create the theme context
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

/**
 * Custom hook to use the theme context
 * @returns {Object} Theme context values
 */
export const useTheme = () => useContext(ThemeContext);

/**
 * ThemeProvider component for managing application theme
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} ThemeProvider component
 */
export const ThemeProvider = ({ children }) => {
  // Check if user has a saved preference
  const getSavedTheme = () => {
    const savedTheme = localStorage.getItem('eduSync-theme');
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check for system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };
  
  // State to hold current theme
  const [theme, setTheme] = useState(getSavedTheme);
  
  // Function to toggle the theme
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('eduSync-theme', newTheme);
      return newTheme;
    });
  };
  
  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Only change if user hasn't set a preference
      if (!localStorage.getItem('eduSync-theme')) {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);
  
  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Add transition class after initial render for smooth transitions
    const timeoutId = setTimeout(() => {
      document.documentElement.classList.add('theme-transition');
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * ThemeToggle component for switching between light and dark themes
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional class name
 * @param {boolean} [props.showLabel] - Whether to show the text label
 * @returns {JSX.Element} ThemeToggle component
 */
export const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <button
      className={`theme-toggle btn btn-${isDark ? 'light' : 'dark'} btn-sm ${className}`}
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="d-flex align-items-center">
        <i 
          className={`bi ${isDark ? 'bi-sun' : 'bi-moon'}`} 
          aria-hidden="true"
        />
        {showLabel && (
          <span className="ms-2">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        )}
      </div>
    </button>
  );
};

ThemeToggle.propTypes = {
  className: PropTypes.string,
  showLabel: PropTypes.bool,
};

export default ThemeProvider;

