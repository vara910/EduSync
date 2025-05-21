import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, ProgressBar, Tab, Tabs, ListGroup, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchStudentDashboardData, refreshDashboard } from '../../features/dashboard/dashboardSlice';
import CourseCard from '../courses/CourseCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import '../../styles/dashboard.css';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { 
    enrolledCourses, 
    studentResults,
    studentDashboard: { isLoading, error, lastUpdated }
  } = useSelector(state => state.dashboard);
  const { user } = useSelector(state => state.auth);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingMessage, setLoadingMessage] = useState('Loading your dashboard...');

  // Function to refresh dashboard data
  const refreshData = useCallback(() => {
    setLoadingMessage('Refreshing dashboard data...');
    dispatch(fetchStudentDashboardData());
  }, [dispatch]);

  useEffect(() => {
    // Only fetch if we haven't loaded or if refresh is requested
    if (!lastUpdated) {
      refreshData();
    }
  }, [lastUpdated, refreshData]);

  // Calculate overall progress with improved handling of missing data
  const calculateOverallProgress = useCallback(() => {
    if (!enrolledCourses || enrolledCourses.length === 0) return 0;
    
    const coursesWithProgress = enrolledCourses.filter(course => 
      typeof course.progress === 'number' && !isNaN(course.progress));
    
    if (coursesWithProgress.length === 0) return 0;
    
    const totalProgress = coursesWithProgress.reduce((sum, course) => 
      sum + course.progress, 0);
      
    return Math.round(totalProgress / coursesWithProgress.length);
  }, [enrolledCourses]);

  const getRecentAssessments = () => {
    if (!studentResults || studentResults.length === 0) return [];
    
    // Sort by attempt date, newest first
    return [...studentResults]
      .sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate))
      .slice(0, 5); // Get last 5
  };

  const getUpcomingAssessments = () => {
    if (!enrolledCourses) return [];
    
    // Collect assessments from all courses that haven't been attempted
    const attemptedIds = studentResults.map(result => result.assessmentId);
    
    const upcoming = enrolledCourses.flatMap(course => 
      (course.assessments || [])
        .filter(assessment => !attemptedIds.includes(assessment.assessmentId))
        .map(assessment => ({
          ...assessment,
          courseName: course.title
        }))
    );
    
    return upcoming.slice(0, 5); // Return top 5
  };

  // Enhanced loading and error handling
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner size="lg" message={loadingMessage} />
      </div>
    );
  }
  
  if (error) {
    return (
      <ErrorAlert 
        message={error} 
        title="Dashboard Error" 
        retryAction={() => {
          dispatch(refreshDashboard());
          refreshData();
        }} 
      />
    );
  }
  
  // Safety check for data availability
  if (!enrolledCourses || !studentResults) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Data Unavailable</Alert.Heading>
        <p>We couldn't retrieve your course data. Please try refreshing the page.</p>
        <Button variant="outline-warning" onClick={refreshData}>Refresh Data</Button>
      </Alert>
    );
  }

  return (
    <Container className="dashboard-container py-4">
      <h1 className="mb-4">Student Dashboard</h1>
      <Row className="mb-4">
        <Col>
          <Card className="welcome-card">
            <Card.Body>
              <h2>Welcome back, {user?.name || 'Student'}</h2>
              <p className="text-muted">Here's what's happening with your courses</p>
              
              <div className="progress-summary">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Overall Progress</span>
                  <span className="progress-percentage">{calculateOverallProgress()}%</span>
                </div>
                <ProgressBar now={calculateOverallProgress()} />
              </div>
              
              <div className="dashboard-stats mt-4">
                <div className="stat-item">
                  <div className="stat-value">{enrolledCourses?.length || 0}</div>
                  <div className="stat-label">Courses</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{studentResults?.length || 0}</div>
                  <div className="stat-label">Assessments</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {studentResults && studentResults.length > 0 
                      ? Math.round(studentResults.reduce((sum, result) => 
                          sum + (result.score / result.maxScore * 100), 0) / studentResults.length) 
                      : 0}%
                  </div>
                  <div className="stat-label">Avg. Score</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 dashboard-tabs"
      >
        <Tab eventKey="overview" title="Overview">
          <Row>
            <Col md={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Recent Assessment Results</h5>
                </Card.Header>
                <ListGroup variant="flush">
                  {getRecentAssessments().length > 0 ? (
                    getRecentAssessments().map(result => (
                      <ListGroup.Item key={result.resultId} className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{result.assessmentTitle}</div>
                          <small className="text-muted">
                            {new Date(result.attemptDate).toLocaleDateString()}
                          </small>
                        </div>
                        <div className="d-flex align-items-center">
                          <Badge bg={result.score / result.maxScore >= 0.7 ? "success" : "warning"} className="me-2">
                            {Math.round(result.score / result.maxScore * 100)}%
                          </Badge>
                          <span>{result.score}/{result.maxScore}</span>
                        </div>
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item>No assessments completed yet</ListGroup.Item>
                  )}
                </ListGroup>
                <Card.Footer className="text-center">
                  <Button as={Link} to="/assessments/results" variant="outline-primary" size="sm">
                    View All Results
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
            
            {/* Last Updated Information */}
            <Col xs={12} className="mt-3 text-end">
              <small className="text-muted">
                Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'} 
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 ms-2" 
                  onClick={() => {
                    dispatch(refreshDashboard());
                    refreshData();
                  }}
                >
                  <i className="bi bi-arrow-clockwise"></i> Refresh
                </Button>
              </small>
            </Col>
            
            <Col md={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Upcoming Assessments</h5>
                </Card.Header>
                <ListGroup variant="flush">
                  {getUpcomingAssessments().length > 0 ? (
                    getUpcomingAssessments().map(assessment => (
                      <ListGroup.Item key={assessment.assessmentId} className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{assessment.title}</div>
                          <small className="text-muted">{assessment.courseName}</small>
                        </div>
                        <Button 
                          as={Link} 
                          to={`/assessments/${assessment.assessmentId}`} 
                          variant="primary" 
                          size="sm"
                        >
                          Start
                        </Button>
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item>No upcoming assessments</ListGroup.Item>
                  )}
                </ListGroup>
                <Card.Footer className="text-center">
                  <Button as={Link} to="/courses" variant="outline-primary" size="sm">
                    Browse Courses
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="courses" title="My Courses">
          {enrolledCourses && enrolledCourses.length > 0 ? (
            <Row>
              {enrolledCourses.map(course => (
                <Col key={course.courseId} md={6} lg={4} className="mb-4">
                  <CourseCard course={course} isEnrolled={true} />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info">
              You are not enrolled in any courses yet. <Link to="/courses">Browse available courses</Link>
            </Alert>
          )}
        </Tab>
        
        <Tab eventKey="materials" title="Course Materials">
          {enrolledCourses && enrolledCourses.length > 0 ? (
            enrolledCourses.map(course => (
              <Card key={course.courseId} className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">{course.title}</h5>
                </Card.Header>
                <ListGroup variant="flush">
                  {course.materials && course.materials.length > 0 ? (
                    course.materials.map(material => (
                      <ListGroup.Item key={material.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{material.fileName}</div>
                          <small className="text-muted">
                            {(material.size / 1024 / 1024).toFixed(2)} MB • 
                            {new Date(material.lastModified).toLocaleDateString()}
                          </small>
                        </div>
                        <div>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            href={material.url}
                            target="_blank"
                            className="me-2"
                          >
                            <i className="bi bi-eye"></i> View
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            href={`/api/courses/${course.courseId}/materials/download/${encodeURIComponent(material.fileName)}`}
                          >
                            <i className="bi bi-download"></i> Download
                          </Button>
                        </div>
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item>No materials available for this course</ListGroup.Item>
                  )}
                </ListGroup>
              </Card>
            ))
          ) : (
            <Alert variant="info">
              You are not enrolled in any courses yet. <Link to="/courses">Browse available courses</Link>
            </Alert>
          )}
        </Tab>
        
        <Tab eventKey="assessments" title="Assessments">
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">All Assessment Results</h5>
                </Card.Header>
                <Card.Body>
                  {studentResults && studentResults.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Assessment</th>
                            <th>Course</th>
                            <th>Date</th>
                            <th>Score</th>
                            <th>Percentage</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentResults.map(result => (
                            <tr key={result.resultId}>
                              <td>{result.assessmentTitle}</td>
                              <td>{result.courseName}</td>
                              <td>{new Date(result.attemptDate).toLocaleDateString()}</td>
                              <td>{result.score}/{result.maxScore}</td>
                              <td>{Math.round(result.score / result.maxScore * 100)}%</td>
                              <td>
                                <Badge bg={result.score / result.maxScore >= 0.7 ? "success" : "warning"}>
                                  {result.score / result.maxScore >= 0.7 ? "Passed" : "Need improvement"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Alert variant="info">
                      You haven't completed any assessments yet.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default StudentDashboard;
