import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useTheme, ThemeToggle } from '../components/providers/ThemeProvider';

/**
 * Demo page for LoadingSpinner component
 * Showcases various configurations and usage examples
 */
const LoadingDemo = () => {
  const { isDark } = useTheme();
  
  // State for interactive demo controls
  const [size, setSize] = useState('md');
  const [variant, setVariant] = useState('primary');
  const [text, setText] = useState('Loading...');
  const [centered, setCentered] = useState(false);
  const [dotStyle, setDotStyle] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [fadeOut, setFadeOut] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Code example string for current configuration
  const codeExample = `<LoadingSpinner
  size="${size}"
  variant="${variant}"
  text="${text}"
  ${centered ? 'centered' : ''}
  ${dotStyle ? 'dotStyle' : ''}
  ${!showSpinner ? 'show={false}' : ''}
  ${fadeOut ? 'fadeOut' : ''}
  ${showOverlay ? 'overlay' : ''}
/>`;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">LoadingSpinner Demo</h1>
          <p className="text-muted">Interactive showcase of the LoadingSpinner component</p>
        </div>
        <div className="d-flex">
          <ThemeToggle className="me-2" showLabel />
          <Link to="/dashboard" className="btn btn-outline-primary">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-8 mb-4">
          {/* Demo Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h2 className="h5 mb-0">Interactive Demo</h2>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowOverlay(!showOverlay)}
              >
                {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
              </button>
            </div>
            <div className="card-body">
              {/* Demo Area */}
              <div 
                className="demo-area border rounded p-5 mb-4 d-flex justify-content-center align-items-center"
                style={{ 
                  minHeight: '200px',
                  backgroundColor: isDark ? 'var(--bg-secondary)' : 'var(--bg-tertiary)'
                }}
              >
                {showOverlay && (
                  <LoadingSpinner
                    overlay
                    size={size}
                    variant={variant}
                    text={text}
                    dotStyle={dotStyle}
                    show={showSpinner}
                    fadeOut={fadeOut}
                  />
                )}
                {!showOverlay && (
                  <LoadingSpinner
                    size={size}
                    variant={variant}
                    text={text}
                    centered={centered}
                    dotStyle={dotStyle}
                    show={showSpinner}
                    fadeOut={fadeOut}
                  />
                )}
              </div>
              
              {/* Code Example */}
              <div className="border rounded p-3 bg-light">
                <h3 className="h6 mb-3">Code Example</h3>
                <pre className="mb-0" style={{ 
                  backgroundColor: isDark ? 'var(--bg-light)' : '#f8f9fa',
                  padding: '15px',
                  borderRadius: '4px',
                  overflowX: 'auto' 
                }}>
                  <code>{codeExample}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          {/* Controls Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header">
              <h2 className="h5 mb-0">Configuration</h2>
            </div>
            <div className="card-body">
              {/* Size Selection */}
              <div className="mb-3">
                <label className="form-label">Size</label>
                <div className="btn-group w-100">
                  <button 
                    type="button" 
                    className={`btn ${size === 'sm' ? 'btn-primary' : 'btn-outline-primary'}`} 
                    onClick={() => setSize('sm')}
                  >
                    Small
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${size === 'md' ? 'btn-primary' : 'btn-outline-primary'}`} 
                    onClick={() => setSize('md')}
                  >
                    Medium
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${size === 'lg' ? 'btn-primary' : 'btn-outline-primary'}`} 
                    onClick={() => setSize('lg')}
                  >
                    Large
                  </button>
                </div>
              </div>
              
              {/* Variant Selection */}
              <div className="mb-3">
                <label className="form-label">Variant</label>
                <select className="form-select" value={variant} onChange={(e) => setVariant(e.target.value)}>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="success">Success</option>
                  <option value="danger">Danger</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              
              {/* Text Input */}
              <div className="mb-3">
                <label className="form-label">Loading Text</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={text} 
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter loading text"
                />
              </div>
              
              {/* Toggle Options */}
              <div className="mb-3">
                <div className="form-check form-switch mb-2">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="centeredSwitch" 
                    checked={centered} 
                    onChange={() => setCentered(!centered)}
                    disabled={showOverlay}
                  />
                  <label className="form-check-label" htmlFor="centeredSwitch">Centered</label>
                </div>
                
                <div className="form-check form-switch mb-2">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="dotStyleSwitch" 
                    checked={dotStyle} 
                    onChange={() => setDotStyle(!dotStyle)}
                  />
                  <label className="form-check-label" htmlFor="dotStyleSwitch">Dot Style</label>
                </div>
                
                <div className="form-check form-switch mb-2">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="showSwitch" 
                    checked={showSpinner} 
                    onChange={() => setShowSpinner(!showSpinner)}
                  />
                  <label className="form-check-label" htmlFor="showSwitch">Show Spinner</label>
                </div>
                
                <div className="form-check form-switch mb-2">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="fadeSwitch" 
                    checked={fadeOut} 
                    onChange={() => setFadeOut(!fadeOut)}
                  />
                  <label className="form-check-label" htmlFor="fadeSwitch">Fade Out Animation</label>
                </div>
              </div>
              
              <button 
                className="btn btn-primary w-100"
                onClick={() => setShowSpinner(!showSpinner)}
              >
                {showSpinner ? 'Hide' : 'Show'} Spinner
              </button>
            </div>
          </div>
          
          {/* Usage Info Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-header">
              <h2 className="h5 mb-0">Usage Notes</h2>
            </div>
            <div className="card-body">
              <ul className="mb-0">
                <li className="mb-2">Use <code>size</code> prop to control spinner size</li>
                <li className="mb-2">Use <code>variant</code> for different colors</li>
                <li className="mb-2">Use <code>overlay</code> for full-screen loading states</li>
                <li className="mb-2">The <code>dotStyle</code> prop shows a dots animation instead</li>
                <li className="mb-2">Add <code>fadeOut</code> for smooth exit animations</li>
                <li>Use <code>show</code> to control visibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Spinner Variants Section */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header">
              <h2 className="h5 mb-0">Spinner Variants</h2>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-3 col-sm-6">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Primary</h3>
                    <LoadingSpinner variant="primary" text="" />
                  </div>
                </div>
                <div className="col-md-3 col-sm-6">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Secondary</h3>
                    <LoadingSpinner variant="secondary" text="" />
                  </div>
                </div>
                <div className="col-md-3 col-sm-6">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Success</h3>
                    <LoadingSpinner variant="success" text="" />
                  </div>
                </div>
                <div className="col-md-3 col-sm-6">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Danger</h3>
                    <LoadingSpinner variant="danger" text="" />
                  </div>
                </div>
                <div className="col-md-3 col-sm-6">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Warning</h3>
                    <LoadingSpinner variant="warning" text="" />
                  </div>
                </div>
                <div className="col-md-3 col-sm-6">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Info</h3>
                    <LoadingSpinner variant="info" text="" />
                  </div>
                </div>
                <div className="col-md-3 col-sm-6">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Light</h3>
                    <LoadingSpinner variant="light" text="" />
                  </div>
                </div>
                <div className="col-md-3 col-sm-6">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Dark</h3>
                    <LoadingSpinner variant="dark" text="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spinner Sizes Section */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header">
              <h2 className="h5 mb-0">Spinner Sizes</h2>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Small</h3>
                    <LoadingSpinner size="sm" text="" />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Medium</h3>
                    <LoadingSpinner size="md" text="" />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Large</h3>
                    <LoadingSpinner size="lg" text="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spinner Styles Section */}
      <div className="row mt-4 mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header">
              <h2 className="h5 mb-0">Spinner Styles</h2>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Border Spinner</h3>
                    <LoadingSpinner text="Loading with border spinner" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Dots Spinner</h3>
                    <LoadingSpinner dotStyle text="Loading with dots spinner" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Text Options and Animations */}
      <div className="row mt-4 mb-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header">
              <h2 className="h5 mb-0">Text and Animations</h2>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">With Text</h3>
                    <LoadingSpinner text="Loading data..." />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Without Text</h3>
                    <LoadingSpinner text="" />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded">
                    <h3 className="h6 mb-3">Centered Mode</h3>
                    <LoadingSpinner centered text="Centered loading" />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 border rounded bg-light">
                <h3 className="h6 mb-3">Animation Demo</h3>
                <p className="mb-3">Click the buttons below to see fade in/out animations</p>
                <div className="d-flex gap-3 mb-3">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setShowSpinner(!showSpinner)}
                  >
                    {showSpinner ? 'Hide' : 'Show'} Spinner
                  </button>
                  <div className="form-check form-switch d-flex align-items-center">
                    <input 
                      className="form-check-input me-2" 
                      type="checkbox" 
                      id="animationSwitch" 
                      checked={fadeOut} 
                      onChange={() => setFadeOut(!fadeOut)}
                    />
                    <label className="form-check-label" htmlFor="animationSwitch">
                      Use Fade Animation
                    </label>
                  </div>
                </div>
                <div className="demo-animation-area p-4 border rounded" style={{ minHeight: '100px' }}>
                  <LoadingSpinner 
                    show={showSpinner} 
                    fadeOut={fadeOut} 
                    text="Watch the fade animation" 
                    centered
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingDemo;

