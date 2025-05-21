import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Tab,
  Nav,
  Alert,
  Spinner,
  ProgressBar,
  ListGroup
} from 'react-bootstrap';
import CourseMaterials from '../components/course/CourseMaterials';
import AssessmentService from '../services/assessment.service';
import CourseService from '../services/course.service';

/**
 * Course detail page component
 * Shows comprehensive information about a course, including materials and assessments
 */
const CourseDetail = () => {
  // Get route params
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // Get auth state from Redux
  const { user, isAuthenticated, role } = useSelector((state) => state.auth);
  
  // State for course data
  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Helper function to check if user is an instructor
  const isInstructor = () => role === 'Instructor';

  // Fetch course data on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }
    
    console.log('Raw courseId from URL:', courseId);
    console.log('CourseId type:', typeof courseId);
    
    // Don't validate here - let the service handle it with more sophisticated logic
    
    const fetchCourseData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Attempt to fetch course details
        console.log('Initiating course fetch...');
        const courseData = await CourseService.getCourseById(courseId);
        console.log('Course data received successfully:', courseData);
        setCourse(courseData);
        
        // Only fetch assessments if we successfully got the course
        if (courseData) {
          console.log('Fetching assessments for course:', courseId);
          const assessmentsData = await AssessmentService.getAssessments(courseId);
          console.log('Assessments data received:', assessmentsData);
          setAssessments(assessmentsData);
        }
      } catch (err) {
        console.error('Error in fetchCourseData:', err);
        console.error('Full error object:', {
          message: err.message,
          response: err.response ? {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data
          } : 'No response object',
          courseId: courseId
        });
        
        // Handle specific error cases
        if (err.message.includes('Invalid course ID format')) {
          setError('The course ID format is invalid. Please check the URL.');
        } else if (err.response?.status === 400) {
          setError(`Bad Request: ${err.response.data?.message || 'Please check the course ID.'}`);
        } else if (err.response?.status === 404) {
          setError('Course not found. It may have been deleted or you may not have access to it.');
        } else {
          setError(err.message || 'Failed to load course details. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, isAuthenticated, navigate]);
  
  // Sort assessments by due date
  const sortedAssessments = [...(assessments || [])].sort((a, b) => {
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  
  // Upcoming assessments (due in the future)
  const upcomingAssessments = sortedAssessments.filter(
    assessment => new Date(assessment.dueDate) > new Date()
  );
  
  // Past assessments (due date has passed)
  const pastAssessments = sortedAssessments.filter(
    assessment => new Date(assessment.dueDate) <= new Date()
  );
  
  // Calculate course progress for students
  const calculateProgress = () => {
    if (!assessments || assessments.length === 0) return 0;
    
    // For demo purposes - in a real app, you'd track completed assessments
    const completed = pastAssessments.length;
    return Math.round((completed / assessments.length) * 100);
  };
  
  // Loading state
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" className="me-2" />
        <span>Loading course details...</span>
      </Container>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/courses')}>
          Back to Courses
        </Button>
      </Container>
    );
  }
  
  // Not found state
  if (!course) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          <i className="bi bi-question-circle-fill me-2"></i>
          Course not found
        </Alert>
        <Button variant="primary" onClick={() => navigate('/courses')}>
          Back to Courses
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      {/* Course header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mb-2">
            <Button 
              variant="outline-secondary" 
              className="me-3" 
              onClick={() => navigate('/courses')}
              aria-label="Back to courses"
            >
              <i className="bi bi-arrow-left"></i>
            </Button>
            <h1 className="mb-0">{course.title}</h1>
          </div>
          <div className="d-flex flex-wrap align-items-center">
            <Badge bg="primary" className="me-2">{course.category}</Badge>
            <Badge bg="secondary" className="me-2">{course.level}</Badge>
            {course.isPublished ? (
              <Badge bg="success">Published</Badge>
            ) : (
              <Badge bg="warning">Draft</Badge>
            )}
            <span className="ms-3 text-muted">Instructor: {course.instructor}</span>
          </div>
        </Col>
        {isInstructor() && (
          <Col xs="auto">
            <Button 
              variant="outline-primary" 
              onClick={() => navigate(`/courses/${courseId}/edit`)}
            >
              <i className="bi bi-pencil me-1"></i>
              Edit Course
            </Button>
          </Col>
        )}
      </Row>
      
      {/* Main content tabs */}
      <Tab.Container 
        activeKey={activeTab} 
        onSelect={(key) => setActiveTab(key)}
      >
        <Row>
          <Col>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="overview">
                  <i className="bi bi-info-circle me-1"></i>
                  Overview
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="materials">
                  <i className="bi bi-folder me-1"></i>
                  Materials
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="assessments">
                  <i className="bi bi-clipboard-check me-1"></i>
                  Assessments
                  {assessments.length > 0 && (
                    <Badge bg="primary" pill className="ms-1">
                      {assessments.length}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>
        
        <Row>
          <Col>
            <Tab.Content>
              {/* Overview tab */}
              <Tab.Pane eventKey="overview">
                <Row>
                  <Col md={8}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h3 className="h5 mb-0">Course Description</h3>
                      </Card.Header>
                      <Card.Body>
                        <p>{course.description}</p>
                        
                        <h4 className="h6 mt-4">Schedule</h4>
                        <div>
                          {course.startDate && (
                            <p className="mb-1">
                              <strong>Start Date:</strong> {new Date(course.startDate).toLocaleDateString()}
                            </p>
                          )}
                          {course.endDate && (
                            <p>
                              <strong>End Date:</strong> {new Date(course.endDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                    
                    {/* Upcoming assessments preview */}
                    <Card className="mb-4">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h3 className="h5 mb-0">Upcoming Assessments</h3>
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={() => setActiveTab('assessments')}
                        >
                          View All
                        </Button>
                      </Card.Header>
                      <ListGroup variant="flush">
                        {upcomingAssessments.length > 0 ? (
                          upcomingAssessments.slice(0, 3).map(assessment => (
                            <ListGroup.Item key={assessment.id}>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h5 className="mb-1">{assessment.title}</h5>
                                  <p className="mb-0 text-muted small">
                                    Due: {new Date(assessment.dueDate).toLocaleString()}
                                  </p>
                                </div>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => navigate(`/assessments/${assessment.id}`)}
                                >
                                  View
                                </Button>
                              </div>
                            </ListGroup.Item>
                          ))
                        ) : (
                          <ListGroup.Item className="text-center py-3 text-muted">
                            No upcoming assessments
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </Card>
                  </Col>
                  
                  <Col md={4}>
                    {/* Course stats */}
                    <Card className="mb-4">
                      <Card.Header>
                        <h3 className="h5 mb-0">Course Stats</h3>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Students Enrolled</span>
                            <strong>{course.students?.length || 0}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>Total Assessments</span>
                            <strong>{assessments.length}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>Course Duration</span>
                            <strong>
                              {course.startDate && course.endDate ? (
                                `${Math.ceil((new Date(course.endDate) - new Date(course.startDate)) / (1000 * 60 * 60 * 24))} days`
                              ) : (
                                'Not specified'
                              )}
                            </strong>
                          </div>
                          {!isInstructor() && (
                            <div className="mt-3">
                              <span>Your Progress</span>
                              <ProgressBar 
                                now={calculateProgress()} 
                                label={`${calculateProgress()}%`}
                                variant="success"
                                className="mt-2"
                              />
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                    
                    {/* Action buttons for students */}
                    {!isInstructor() && (
                      <Card className="mb-4">
                        <Card.Body>
                          <Button 
                            variant="outline-primary" 
                            className="w-100 mb-2"
                            onClick={() => setActiveTab('materials')}
                          >
                            <i className="bi bi-journal-text me-1"></i>
                            View Course Materials
                          </Button>
                          <Button 
                            variant="outline-info" 
                            className="w-100"
                            onClick={() => setActiveTab('assessments')}
                          >
                            <i className="bi bi-clipboard-check me-1"></i>
                            View Assessments
                          </Button>
                        </Card.Body>
                      </Card>
                    )}
                    
                    {/* Instructor tools */}
                    {isInstructor() && (
                      <Card className="mb-4">
                        <Card.Header>
                          <h3 className="h5 mb-0">Instructor Tools</h3>
                        </Card.Header>
                        <ListGroup variant="flush">
                          <ListGroup.Item action onClick={() => setActiveTab('materials')}>
                            <i className="bi bi-folder-plus me-2"></i>
                            Manage Course Materials
                          </ListGroup.Item>
                          <ListGroup.Item action onClick={() => navigate(`/courses/${courseId}/assessments/new`)}>
                            <i className="bi bi-file-earmark-plus me-2"></i>
                            Create New Assessment
                          </ListGroup.Item>
                          <ListGroup.Item action onClick={() => navigate(`/courses/${courseId}/students`)}>
                            <i className="bi bi-people me-2"></i>
                            Manage Students
                          </ListGroup.Item>
                          <ListGroup.Item action onClick={() => navigate(`/courses/${courseId}/reports`)}>
                            <i className="bi bi-bar-chart me-2"></i>
                            View Reports
                          </ListGroup.Item>
                        </ListGroup>
                      </Card>
                    )}
                  </Col>
                </Row>
              </Tab.Pane>
              
              {/* Materials tab */}
              <Tab.Pane eventKey="materials">
                <Card>
                  <Card.Header>
                    <h3 className="h5 mb-0">Course Materials</h3>
                  </Card.Header>
                  <Card.Body>
                    {/* Integrate the CourseMaterials component */}
                    <CourseMaterials courseId={courseId} />
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              {/* Assessments tab */}
              <Tab.Pane eventKey="assessments">
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h3 className="h5 mb-0">Assessments</h3>
                    {isInstructor() && (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => navigate(`/courses/${courseId}/assessments/new`)}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Create Assessment
                      </Button>
                    )}
                  </Card.Header>
                  <Card.Body>
                    {assessments.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="bi bi-clipboard-x fs-3 text-muted"></i>
                        <p className="mt-2 text-muted">No assessments available for this course yet.</p>
                        {isInstructor() && (
                          <Button 
                            variant="primary" 
                            onClick={() => navigate(`/courses/${courseId}/assessments/new`)}
                          >
                            <i className="bi bi-plus-circle me-1"></i>
                            Create First Assessment
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Upcoming assessments */}
                        {upcomingAssessments.length > 0 && (
                          <div className="mb-4">
                            <h4 className="h6 mb-3">Upcoming Assessments</h4>
                            <ListGroup>
                              {upcomingAssessments.map(assessment => (
                                <ListGroup.Item 
                                  key={assessment.id}
                                  className="d-flex justify-content-between align-items-center"
                                >
                                  <div>
                                    <h5 className="mb-1">{assessment.title}</h5>
                                    <p className="mb-0 text-muted small">
                                      Due: {new Date(assessment.dueDate).toLocaleString()}
                                      {' · '}
                                      {assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}
                                      {' · '}
                                      {assessment.points} points
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => navigate(`/assessments/${assessment.id}`)}
                                  >
                                    {isInstructor() ? 'Manage' : 'Start'}
                                  </Button>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          </div>
                        )}
                        
                        {/* Past assessments */}
                        {pastAssessments.length > 0 && (
                          <div>
                            <h4 className="h6 mb-3">Past Assessments</h4>
                            <ListGroup>
                              {pastAssessments.map(assessment => (
                                <ListGroup.Item 
                                  key={assessment.id}
                                  className="d-flex justify-content-between align-items-center"
                                >
                                  <div>
                                    <h5 className="mb-1">{assessment.title}</h5>
                                    <p className="mb-0 text-muted small">
                                      Due: {new Date(assessment.dueDate).toLocaleString()}
                                      {' · '}
                                      {assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}
                                      {' · '}
                                      {assessment.points} points
                                      {!isInstructor() && assessment.score && (
                                        <>
                                          {' · '}
                                          <Badge bg={assessment.score >= assessment.points * 0.6 ? 'success' : 'danger'}>
                                            Score: {assessment.score}/{assessment.points}
                                          </Badge>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={() => navigate(`/assessments/${assessment.id}`)}
                                  >
                                    {isInstructor() ? 'View Results' : 'View Feedback'}
                                  </Button>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          </div>
                        )}
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default CourseDetail;
