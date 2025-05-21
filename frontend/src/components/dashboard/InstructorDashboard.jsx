import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Tab, Tabs, ListGroup, Alert, Modal, Form, Table, ProgressBar, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  fetchInstructorDashboardData,
  fetchInstructorCourses, 
  fetchCourseResults, 
  fetchAssessmentSummaries,
  uploadCourseMaterial,
  refreshDashboard
} from '../../features/dashboard/dashboardSlice';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import '../../styles/dashboard.css';

const InstructorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    instructorCourses, 
    courseResults, 
    assessmentSummaries,
    materialUploadStatus,
    instructorDashboard: { isLoading, error, lastUpdated }
  } = useSelector(state => state.dashboard);
  const { user } = useSelector(state => state.auth);
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCourseId, setUploadCourseId] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading instructor dashboard...');
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [newCourseData, setNewCourseData] = useState({ title: '', description: '', category: '' });
  const [chartData, setChartData] = useState([]);
  
  // Fetch dashboard data
  const refreshData = useCallback(() => {
    setLoadingMessage('Refreshing dashboard data...');
    dispatch(fetchInstructorDashboardData());
  }, [dispatch]);
  
  useEffect(() => {
    if (!lastUpdated) {
      refreshData();
    }
  }, [lastUpdated, refreshData]);
  
  // Prepare chart data whenever assessmentSummaries changes
  useEffect(() => {
    if (assessmentSummaries?.length > 0) {
      // Prepare data for charts
      const chartData = assessmentSummaries.map(summary => ({
        name: summary.title.length > 20 ? summary.title.substring(0, 20) + '...' : summary.title,
        completed: summary.attemptedCount,
        pending: summary.totalStudentsCount - summary.attemptedCount,
        avgScore: Math.round(summary.averageScore || 0)
      }));
      setChartData(chartData);
    }
  }, [assessmentSummaries]);
  
  // Handler functions
  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId);
    dispatch(fetchCourseResults(courseId));
  };
  
  const handleShowUploadModal = (courseId) => {
    setUploadCourseId(courseId);
    setShowUploadModal(true);
  };
  
  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadCourseId(null);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (uploadFile && uploadCourseId) {
      const formData = new FormData();
      formData.append('file', uploadFile);
      await dispatch(uploadCourseMaterial({ courseId: uploadCourseId, file: formData }));
      
      if (!materialUploadStatus.error) {
        handleCloseUploadModal();
        refreshData(); // Refresh data after successful upload
      }
    }
  };
  
  const handleNewCourse = () => {
    setShowNewCourseModal(true);
  };
  
  const handleCloseNewCourseModal = () => {
    setShowNewCourseModal(false);
    setNewCourseData({ title: '', description: '', category: '' });
  };
  
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    // This would call a createCourse action in a real implementation
    // For now, we'll just simulate it with a timeout
    handleCloseNewCourseModal();
    setTimeout(() => {
      refreshData();
    }, 500);
  };
  
  const handleNewAssessment = (courseId) => {
    navigate(`/assessments/create?courseId=${courseId}`);
  };
  
  // Data processing utilities
  const getTotalStudents = useCallback(() => {
    if (!instructorCourses) return 0;
    
    // Get unique student IDs across all courses
    const uniqueStudentIds = new Set();
    instructorCourses.forEach(course => {
      (course.enrollments || []).forEach(enrollment => {
        uniqueStudentIds.add(enrollment.studentId);
      });
    });
    
    return uniqueStudentIds.size;
  }, [instructorCourses]);
  
  const getActiveStudents = useCallback(() => {
    if (!instructorCourses) return 0;
    
    // Count students who have logged in within the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeStudents = instructorCourses.reduce((count, course) => {
      return count + (course.enrollments || []).filter(
        enrollment => new Date(enrollment.lastActive) > thirtyDaysAgo
      ).length;
    }, 0);
    
    return activeStudents;
  }, [instructorCourses]);
  
  const getAverageScore = useCallback(() => {
    if (!assessmentSummaries || assessmentSummaries.length === 0) return 0;
    
    const totalAverage = assessmentSummaries.reduce(
      (sum, summary) => sum + (summary.averageScore || 0), 
      0
    );
    
    return Math.round(totalAverage / assessmentSummaries.length);
  }, [assessmentSummaries]);
  
  const getCompletionRate = useCallback(() => {
    if (!instructorCourses) return 0;
    
    let totalProgress = 0;
    let enrollmentCount = 0;
    
    instructorCourses.forEach(course => {
      (course.enrollments || []).forEach(enrollment => {
        totalProgress += enrollment.progress || 0;
        enrollmentCount++;
      });
    });
    
    return enrollmentCount ? Math.round(totalProgress / enrollmentCount) : 0;
  }, [instructorCourses]);
  
  // Loading and error handling
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
  if (!instructorCourses || !assessmentSummaries) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Data Unavailable</Alert.Heading>
        <p>We couldn't retrieve your instructor data. Please try refreshing the page.</p>
        <Button variant="outline-warning" onClick={refreshData}>Refresh Data</Button>
      </Alert>
    );
  }
  return (
    <Container className="dashboard-container py-4">
      <h1 className="mb-4">Instructor Dashboard</h1>
      
      {/* Welcome Card */}
      <Row className="mb-4">
        <Col>
          <Card className="welcome-card">
            <Card.Body>
              <h2>Welcome back, {user?.name || 'Instructor'}</h2>
              <p className="text-muted">Here's what's happening with your courses</p>
              
              <div className="dashboard-stats mt-4">
                <div className="stat-item">
                  <div className="stat-value">{instructorCourses?.length || 0}</div>
                  <div className="stat-label">Courses</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{getTotalStudents()}</div>
                  <div className="stat-label">Students</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{getAverageScore()}%</div>
                  <div className="stat-label">Avg. Score</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{getCompletionRate()}%</div>
                  <div className="stat-label">Completion</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Last Updated Info */}
      <Row className="mb-3">
        <Col xs={12} className="text-end">
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
      </Row>

      {/* Dashboard Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 dashboard-tabs"
      >
        {/* OVERVIEW TAB */}
        <Tab eventKey="overview" title="Overview">
          <Row>
            {/* Student Distribution Chart */}
            <Col lg={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Students per Course</h5>
                </Card.Header>
                <Card.Body>
                  {instructorCourses && instructorCourses.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={instructorCourses.map(course => ({
                          name: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
                          students: course.enrollments?.length || 0
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="students" fill="#8884d8" name="Enrolled Students" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-5">
                      <p>No course data available</p>
                      <Button onClick={handleNewCourse} variant="primary">
                        Create a Course
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            {/* Assessment Completion Chart */}
            <Col lg={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Assessment Completion</h5>
                </Card.Header>
                <Card.Body>
                  {chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        barGap={0}
                        barCategoryGap="15%"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" stackId="a" fill="#4caf50" name="Completed" />
                        <Bar dataKey="pending" stackId="a" fill="#ff9800" name="Pending" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-5">
                      <p>No assessment data available</p>
                      <Button as={Link} to="/assessments/create" variant="primary">
                        Create an Assessment
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            {/* Assessment Statistics */}
            <Col lg={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Recent Assessment Statistics</h5>
                </Card.Header>
                <Card.Body>
                  {assessmentSummaries && assessmentSummaries.length > 0 ? (
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Assessment</th>
                          <th>Course</th>
                          <th>Completion</th>
                          <th>Avg. Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessmentSummaries.slice(0, 5).map(summary => (
                          <tr key={summary.assessmentId}>
                            <td>{summary.title}</td>
                            <td>{summary.courseName}</td>
                            <td>
                              {Math.round(summary.attemptedCount / summary.totalStudentsCount * 100)}%
                              <ProgressBar 
                                now={Math.round(summary.attemptedCount / summary.totalStudentsCount * 100)} 
                                variant={summary.attemptedCount / summary.totalStudentsCount > 0.7 ? "success" : "warning"}
                                className="mt-1"
                                style={{ height: "5px" }}
                              />
                            </td>
                            <td>
                              <Badge bg={summary.averageScore >= 70 ? "success" : "warning"}>
                                {Math.round(summary.averageScore)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">No assessment data available</Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            {/* Quick Actions */}
            <Col lg={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Quick Actions</h5>
                </Card.Header>
                <ListGroup variant="flush">
                  <ListGroup.Item action onClick={handleNewCourse}>
                    <div className="d-flex align-items-center">
                      <div className="action-icon bg-primary text-white rounded p-2 me-3">
                        <i className="bi bi-journal-plus"></i>
                      </div>
                      <div>
                        <h6 className="mb-0">Create New Course</h6>
                        <small className="text-muted">Add a new course to your teaching portfolio</small>
                      </div>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item action as={Link} to="/assessments/create">
                    <div className="d-flex align-items-center">
                      <div className="action-icon bg-success text-white rounded p-2 me-3">
                        <i className="bi bi-file-earmark-check"></i>
                      </div>
                      <div>
                        <h6 className="mb-0">Create Assessment</h6>
                        <small className="text-muted">Create a new quiz or assignment</small>
                      </div>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item action as={Link} to="/students">
                    <div className="d-flex align-items-center">
                      <div className="action-icon bg-info text-white rounded p-2 me-3">
                        <i className="bi bi-people"></i>
                      </div>
                      <div>
                        <h6 className="mb-0">Manage Students</h6>
                        <small className="text-muted">View and manage your students</small>
                      </div>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item action as={Link} to="/reports">
                    <div className="d-flex align-items-center">
                      <div className="action-icon bg-warning text-white rounded p-2 me-3">
                        <i className="bi bi-file-earmark-bar-graph"></i>
                      </div>
                      <div>
                        <h6 className="mb-0">Generate Reports</h6>
                        <small className="text-muted">Create performance and progress reports</small>
                      </div>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>
        </Tab>
        
        {/* COURSES TAB */}
        <Tab eventKey="courses" title="Courses">
          <Row className="mb-4">
            <Col xs={12} className="d-flex justify-content-end">
              <Button variant="primary" onClick={handleNewCourse}>
                <i className="bi bi-plus-circle me-2"></i> Create New Course
              </Button>
            </Col>
          </Row>
          
          {instructorCourses && instructorCourses.length > 0 ? (
            <Row>
              {instructorCourses.map(course => (
                <Col key={course.courseId} lg={4} md={6} className="mb-4">
                  <Card className="h-100 course-card">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">{course.title}</h5>
                      <Badge bg="primary" pill>{course.enrollments?.length || 0} Students</Badge>
                    </Card.Header>
                    <Card.Body>
                      <p className="course-description">{course.description || 'No description provided.'}</p>
                      
                      <div className="course-stats mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span>Overall Progress</span>
                          <span>
                            {(() => {
                              if (!course.enrollments || course.enrollments.length === 0) return '0%';
                              const avgProgress = course.enrollments.reduce(
                                (sum, enrollment) => sum + (enrollment.progress || 0), 0
                              ) / course.enrollments.length;
                              return `${Math.round(avgProgress)}%`;
                            })()}
                          </span>
                        </div>
                        <ProgressBar 
                          now={(() => {
                            if (!course.enrollments || course.enrollments.length === 0) return 0;
                            return course.enrollments.reduce(
                              (sum, enrollment) => sum + (enrollment.progress || 0), 0
                            ) / course.enrollments.length;
                          })()}
                          variant="success" 
                        />
                      </div>
                      
                      <div className="d-flex flex-wrap gap-2">
                        <Button 
                          as={Link} 
                          to={`/courses/${course.courseId}`}
                          variant="outline-primary" 
                          size="sm"
                        >
                          <i className="bi bi-pencil me-1"></i> Edit
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          onClick={() => handleShowUploadModal(course.courseId)}
                        >
                          <i className="bi bi-upload me-1"></i> Upload Materials
                        </Button>
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          onClick={() => handleNewAssessment(course.courseId)}
                        >
                          <i className="bi bi-file-earmark-plus me-1"></i> Add Assessment
                        </Button>
                      </div>
                    </Card.Body>
                    <Card.Footer className="text-muted">
                      <small>Created: {new Date(course.createdAt).toLocaleDateString()}</small>
                      <div className="mt-2">
                        <Badge bg="secondary" className="me-1">{course.category || 'Uncategorized'}</Badge>
                        {course.isPublished ? (
                          <Badge bg="success">Published</Badge>
                        ) : (
                          <Badge bg="warning">Draft</Badge>
                        )}
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info">
              <Alert.Heading>No Courses Found</Alert.Heading>
              <p>You haven't created any courses yet. Click the button above to create your first course.</p>
            </Alert>
          )}
        </Tab>
        
        {/* ASSESSMENTS TAB */}
        <Tab eventKey="assessments" title="Assessments">
          <Row className="mb-4">
            <Col xs={12} className="d-flex justify-content-end">
              <Button 
                as={Link} 
                to="/assessments/create" 
                variant="primary"
              >
                <i className="bi bi-plus-circle me-2"></i> Create New Assessment
              </Button>
            </Col>
          </Row>
          
          {assessmentSummaries && assessmentSummaries.length > 0 ? (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Completion</th>
                    <th>Avg. Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentSummaries.map(assessment => (
                    <tr key={assessment.assessmentId}>
                      <td>{assessment.title}</td>
                      <td>{assessment.courseName}</td>
                      <td>
                        <Badge bg={assessment.type === 'Quiz' ? 'info' : 'secondary'}>
                          {assessment.type || 'Assessment'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="me-2">
                            {Math.round(assessment.attemptedCount / assessment.totalStudentsCount * 100)}%
                          </div>
                          <ProgressBar 
                            now={Math.round(assessment.attemptedCount / assessment.totalStudentsCount * 100)}
                            style={{ height: '8px', width: '80px' }}
                            variant={assessment.attemptedCount / assessment.totalStudentsCount > 0.7 ? 'success' : 'warning'}
                          />
                        </div>
                      </td>
                      <td>
                        <Badge bg={assessment.averageScore >= 70 ? 'success' : 'warning'}>
                          {Math.round(assessment.averageScore)}%
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            as={Link} 
                            to={`/assessments/${assessment.assessmentId}/results`}
                            variant="outline-primary" 
                            size="sm"
                          >
                            <i className="bi bi-bar-chart"></i>
                          </Button>
                          <Button 
                            as={Link} 
                            to={`/assessments/${assessment.assessmentId}/edit`}
                            variant="outline-secondary" 
                            size="sm"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info">
              <Alert.Heading>No Assessments Found</Alert.Heading>
              <p>You haven't created any assessments yet. Click the button above to create your first assessment.</p>
            </Alert>
          )}
        </Tab>
      </Tabs>
      
      {/* New Course Modal */}
      <Modal show={showNewCourseModal} onHide={handleCloseNewCourseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateCourse}>
            <Form.Group className="mb-3">
              <Form.Label>Course Title</Form.Label>
              <Form.Control 
                type="text" 
                value={newCourseData.title}
                onChange={(e) => setNewCourseData({...newCourseData, title: e.target.value})}
                placeholder="Enter course title" 
                required 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={newCourseData.description}
                onChange={(e) => setNewCourseData({...newCourseData, description: e.target.value})}
                placeholder="Enter course description" 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={newCourseData.category}
                onChange={(e) => setNewCourseData({...newCourseData, category: e.target.value})}
              >
                <option value="">Select a category</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="Languages">Languages</option>
                <option value="Arts">Arts</option>
                <option value="Business">Business</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={handleCloseNewCourseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Create Course
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Material Upload Modal */}
      <Modal show={showUploadModal} onHide={handleCloseUploadModal}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Course Material</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {materialUploadStatus.isUploading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" variant="primary" />
              <p className="mt-3">Uploading your file... Please wait.</p>
            </div>
          ) : materialUploadStatus.error ? (
            <Alert variant="danger">
              <Alert.Heading>Upload Failed</Alert.Heading>
              <p>{materialUploadStatus.error}</p>
              <Button 
                variant="outline-danger" 
                onClick={() => setUploadFile(null)}
              >
                Try Again
              </Button>
            </Alert>
          ) : (
            <Form onSubmit={handleFileUpload}>
              <Form.Group className="mb-3">
                <Form.Label>Select File to Upload</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  required
                />
                <Form.Text className="text-muted">
                  Accepted formats: PDF, DOC, DOCX, PPT, PPTX, ZIP (Max size: 50MB)
                </Form.Text>
              </Form.Group>
              
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="secondary" onClick={handleCloseUploadModal}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={!uploadFile}
                >
                  Upload Material
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default InstructorDashboard;
