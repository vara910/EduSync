import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import CourseList from '../components/course/CourseList';
import CreateCourseModal from '../components/course/CreateCourseModal';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CourseService from '../services/course.service';

const Courses = () => {
  const navigate = useNavigate();
  // Get auth state from Redux
  const { user, isAuthenticated, role } = useSelector((state) => state.auth);
  
  // Helper function to check if user is an instructor
  const isInstructor = () => role === 'Instructor';
  
  // State for courses data
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        let fetchedCourses;
        if (isInstructor()) {
          // Instructors see their own courses
          fetchedCourses = await CourseService.getInstructorCourses();
        } else {
          // Students see all published courses
          fetchedCourses = await CourseService.getAllCourses();
        }
        setCourses(fetchedCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch courses if user is authenticated
    if (isAuthenticated) {
      fetchCourses();
    } else {
      setLoading(false);
      setError('Please log in to view courses.');
    }
  }, [isAuthenticated, role]);
  
  // Modal handlers
  const handleOpenModal = (course = null) => {
    setSelectedCourse(course);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setSelectedCourse(null);
    setShowModal(false);
  };
  
  // CRUD operations
  const handleSaveCourse = async (courseData) => {
    try {
      let response;
      
      if (courseData.id) {
        // Update existing course
        response = await CourseService.updateCourse(courseData.id, courseData);
        
        // Update local state
        setCourses(prevCourses => 
          prevCourses.map(c => 
            c.id === courseData.id ? response : c
          )
        );
      } else {
        // Create new course
        response = await CourseService.createCourse(courseData);
        
        // Add to local state
        setCourses(prevCourses => [...prevCourses, response]);
      }
      
      // Close modal after successful operation
      handleCloseModal();
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error saving course:', err);
      return Promise.reject(new Error(err.response?.data?.message || 'Failed to save the course. Please try again.'));
    }
  };
  
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }
    
    try {
      setLoading(true);
      await CourseService.deleteCourse(courseId);
      
      // Update local state
      setCourses(prevCourses => prevCourses.filter(c => c.id !== courseId));
      setError(null);
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.response?.data?.message || 'Failed to delete the course. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewCourse = (course) => {
    // Extract the appropriate ID property
    // Backend expects a courseId in GUID format
    const courseId = course.id || course.courseId || course.course_id;
    
    console.log('Viewing course:', course);
    console.log('Using courseId:', courseId);
    
    // Validate courseId before navigation
    if (!courseId) {
      console.error('Invalid course ID:', course);
      setError('Cannot view course: Invalid course ID format');
      return;
    }
    
    // Navigate to the course detail page
    console.log('Navigating to /courses/' + courseId);
    navigate(`/courses/${courseId}`);
  };
  
  const handleRefreshCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (isInstructor()) {
        response = await CourseService.getInstructorCourses();
      } else {
        response = await CourseService.getAllCourses();
      }
      
      setCourses(response);
    } catch (err) {
      console.error('Error refreshing courses:', err);
      setError('Failed to refresh courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render content based on loading/error state
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Please <Button variant="link" onClick={() => navigate('/login')}>login</Button> to view courses.
        </Alert>
      </Container>
    );
  }
  
  // Show loading spinner
  if (loading && courses.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" className="me-2" />
        <span>Loading courses...</span>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Page header with refresh button */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Courses</h1>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          {/* Add New Course button - only visible to instructors */}
          {isInstructor() && (
            <Button 
              variant="primary" 
              onClick={() => handleOpenModal()}
              disabled={loading}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Add New Course
            </Button>
          )}
          
          {/* Refresh button */}
          <Button 
            variant="outline-secondary" 
            onClick={handleRefreshCourses}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner 
                  as="span" 
                  animation="border" 
                  size="sm" 
                  role="status" 
                  aria-hidden="true" 
                  className="me-1"
                />
                Refreshing...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </>
            )}
          </Button>
        </Col>
      </Row>
      
      {/* Error message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}
      
      {/* Course list */}
      <CourseList 
        courses={courses}
        onEdit={handleOpenModal}
        onDelete={handleDeleteCourse}
        onView={handleViewCourse}  // handleViewCourse now expects full course object
      />
      
      {/* Create/Edit course modal */}
      <CreateCourseModal
        show={showModal}
        handleClose={handleCloseModal}
        course={selectedCourse}
        onSave={handleSaveCourse}
      />
    </Container>
  );
};

export default Courses;
