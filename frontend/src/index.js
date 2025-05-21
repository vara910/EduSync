// React and third-party libraries
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './features/store';

// CSS imports in order
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/index.css';

// Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// App component and providers
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import ThemeProvider from './components/providers/ThemeProvider';

// Optional: Add polyfills if needed for older browsers
// import 'whatwg-fetch'; // Fetch polyfill
// import 'core-js/stable'; // Core-js polyfills
// import 'regenerator-runtime/runtime'; // Regenerator runtime for async/await

// Initialize any global configurations
const initializeApp = () => {
  // Set up error tracking, analytics, etc. here
  
  // Log environment for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('EduSync running in development mode');
  }
};

// Run initialization
initializeApp();

// Get the root element
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

// Render the app
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

