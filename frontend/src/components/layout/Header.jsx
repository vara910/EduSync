import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/authSlice';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <h3 className="m-0">EduSync</h3>
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          onClick={toggleMenu}
          aria-controls="navbarNav" 
          aria-expanded={isMenuOpen ? "true" : "false"} 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
            </li>
            
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link className="nav-link" to="/courses" onClick={() => setIsMenuOpen(false)}>
                    Courses
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link className="nav-link" to="/assessment" onClick={() => setIsMenuOpen(false)}>
                    Assessments
                  </Link>
                </li>
                
                {/* Instructor-specific menu items */}
                {role === 'Instructor' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/course-management" onClick={() => setIsMenuOpen(false)}>
                      Course Management
                    </Link>
                  </li>
                )}
                
                <li className="nav-item">
                  <Link className="nav-link" to="/profile" onClick={() => setIsMenuOpen(false)}>
                    {user?.name || 'Profile'}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link" 
                    onClick={handleLogout}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register" onClick={() => setIsMenuOpen(false)}>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;

