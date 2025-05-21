import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Alert, 
  Spinner, 
  ListGroup,
  Form,
  Modal,
  Tab,
  Nav
} from 'react-bootstrap';
import AssessmentFiles from '../components/assessment/AssessmentFiles';
import AssessmentService from '../services/assessment.service';
import CourseService from '../services/course.service';

/**
 * Assessment detail page component
 * Shows comprehensive information about an assessment with different views for students and instructors
 */
const AssessmentDetail = () => {
  // Get route params
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  
  // Get auth state from Redux
  const { user, isAuthenticated, role } = useSelector((state) => state.auth);
  
  // State for assessment data
  const [assessment, setAssessment] = useState(null);
  const [course, setCourse] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // State for instructor grading
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [gradingError, setGradingError] = useState(null);
  const [submittingGrade, setSubmittingGrade] = useState(false);
  
  // Helper function to check if user is an instructor
  const isInstructor = () => role === 'Instructor';
  
  // Check if submission deadline has passed
  const isSubmissionClosed = assessment ? new Date(assessment.dueDate) < new Date() : false;
  
  // Check if the current user has submitted
  const hasSubmitted = submissions.some(sub => sub.studentId === user?.id);
  
  // Fetch assessment data on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/assessments/${assessmentId}` } });
      return;
    }
    
    const fetchAssessmentData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch assessment details
        const assessmentData = await AssessmentService.getAssessmentById(assessmentId);
        setAssessment(assessmentData);
        
        // Fetch course details for breadcrumb navigation
        if (assessmentData?.courseId) {
          const courseData = await CourseService.getCourseById(assessmentData.courseId);
          setCourse(courseData);
        }
        
        // Fetch submissions (for instructors, all submissions; for students, only theirs)
        if (isInstructor()) {
          // For instructors - all submissions for this assessment
          const submissionsData = await AssessmentService.getCourseResults(assessmentData.courseId);
          setSubmissions(submissionsData.filter(sub => sub.assessmentId === assessmentId));
        } else {
          // For students - only their submissions
          const submissionsData = await AssessmentService.getResults(assessmentData.courseId);
          setSubmissions(submissionsData.filter(sub => sub.assessmentId === assessmentId));
        }
      } catch (err) {
        console.error('Error fetching assessment data:', err);
        setError('Failed to load assessment details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssessmentData();
  }, [assessmentId, isAuthenticated, navigate]);
  
  // Handle submission status
  const getSubmissionStatus = () => {
    if (isSubmissionClosed) {
      if (hasSubmitted) {
        const userSubmission = submissions.find(sub => sub.studentId === user?.id);
        if (userSubmission?.score !== undefined) {
          return {
            variant: userSubmission.score >= (assessment.points * 0.6) ? 'success' : 'danger',
            text: 'Graded',
            icon: 'bi-check-circle-fill'
          };
        } else {
          return {
            variant: 'info',
            text: 'Submitted, Pending Grade',
            icon: 'bi-hourglass-split'
          };
        }
      } else {
        return {
          variant: 'danger',
          text: 'Missed',
          icon: 'bi-x-circle-fill'
        };
      }
    } else {
      if (hasSubmitted) {
        return {
          variant: 'info',
          text: 'Submitted, Can Resubmit',
          icon: 'bi-arrow-repeat'
        };
      } else {
        return {
          variant: 'warning',
          text: 'Not Submitted',
          icon: 'bi-exclamation-circle-fill'
        };
      }
    }
  };
  
  // Handle opening grade modal
  const handleOpenGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setFeedback(submission.feedback || '');
    setScore(submission.score || 0);
    setGradingError(null);
    setShowGradeModal(true);
  };
  
  // Handle grade submission
  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return;
    
    setSubmittingGrade(true);
    setGradingError(null);
    
    try {
      // In a real implementation, this would call a specific API endpoint
      // await AssessmentService.gradeSubmission(selectedSubmission.id, score, feedback);
      
      // For demo purposes, update the submission in our local state
      const updatedSubmission = {
        ...selectedSubmission,
        score,
        feedback,
        gradedBy: user.name,
        gradedAt: new Date().toISOString()
      };
      
      // Update submissions list
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(sub => 
          sub.id === selectedSubmission.id ? updatedSubmission : sub
        )
      );
      
      // Close the modal
      setShowGradeModal(false);
    } catch (err) {
      console.error('Error submitting grade:', err);
      setGradingError('Failed to submit grade. Please try again.');
    } finally {
      setSubmittingGrade(false);
    }
  };
  
  // Calculate class average score
  const calculateClassAverage = () => {
    const gradedSubmissions = submissions.filter(sub => sub.score !== undefined);
    if (gradedSubmissions.length === 0) return 'No grades yet';
    
    const total = gradedSubmissions.reduce((sum, sub) => sum + sub.score, 0);
    return `${(total / gradedSubmissions.length).toFixed(1)} / ${assessment?.points || 0}`;
  };
  
  // Calculate submission rate
  const calculateSubmissionRate = () => {
    if (!assessment?.enrolledStudents) return '0%';
    
    const uniqueSubmitters = new Set(submissions.map(sub => sub.studentId)).size;
    return `${Math.round((uniqueSubmitters / assessment.enrolledStudents) * 100)}%`;
  };
  
  // Loading state
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" className="me-2" />
        <span>Loading assessment details...</span>
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
  if (!assessment) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          <i className="bi bi-question-circle-fill me-2"></i>
          Assessment not found
        </Alert>
        <Button variant="primary" onClick={() => navigate('/courses')}>
          Back to Courses
        </Button>
      </Container>
    );
  }
  
  // Student view
  if (!isInstructor()) {
    const status = getSubmissionStatus();
    
    return (
      <Container className="py-4">
        {/* Navigation breadcrumbs */}
        <div className="mb-4">
          <Button 
            variant="outline-secondary" 
            className="me-2" 
            size="sm"
            onClick={() => course 
              ? navigate(`/courses/${course.id}`) 
              : navigate('/courses')
            }
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back to {course ? course.title : 'Courses'}
          </Button>
        </div>
        
        {/* Assessment header */}
        <Row className="mb-4">
          <Col>
            <h1>{assessment.title}</h1>
            <div className="d-flex flex-wrap align-items-center">
              <Badge bg="secondary" className="me-2">{assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}</Badge>
              <Badge bg="primary" className="me-2">{assessment.points} Points</Badge>
              <span className="text-muted me-3">Due: {new Date(assessment.dueDate).toLocaleString()}</span>
              
              {/* Submission status */}
              <Badge bg={status.variant} className="ms-2">
                <i className={`bi ${status.icon} me-1`}></i>
                {status.text}
              </Badge>
            </div>
          </Col>
        </Row>
        
        <Row>
          <Col md={8}>
            {/* Assessment details */}
            <Card className="mb-4">
              <Card.Header>
                <h2 className="h5 mb-0">Assignment Details</h2>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  {assessment.description}
                </div>
                
                {assessment.instructions && (
                  <div className="mt-4">
                    <h3 className="h6">Instructions</h3>
                    <div className="p-3 bg-light rounded">
                      {assessment.instructions}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
            
            {/* Files section */}
            <Card className="mb-4">
              <Card.Header>
                <h2 className="h5 mb-0">Files & Submission</h2>
              </Card.Header>
              <Card.Body>
                <AssessmentFiles 
                  assessmentId={assessmentId}
                  courseId={assessment.courseId}
                  dueDate={assessment.dueDate}
                  isSubmissionAllowed={!isSubmissionClosed || assessment.allowLateSubmissions}
                />
              </Card.Body>
            </Card>
            
            {/* Show feedback if graded */}
            {submissions.length > 0 && submissions[0].score !== undefined && (
              <Card className="mb-4 border-success">
                <Card.Header className="bg-success text-white">
                  <h2 className="h5 mb-0">Your Grade</h2>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <h3 className="h6">Score</h3>
                    <h4 className={submissions[0].score >= (assessment.points * 0.6) ? 'text-success' : 'text-danger'}>
                      {submissions[0].score} / {assessment.points} points
                      {submissions[0].score >= (assessment.points * 0.6) ? ' (Passed)' : ' (Failed)'}
                    </h4>
                  </div>
                  
                  {submissions[0].feedback && (
                    <div>
                      <h3 className="h6">Instructor Feedback</h3>
                      <div className="p-3 bg-light rounded">
                        {submissions[0].feedback}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-muted small">
                    Graded by {submissions[0].gradedBy} on {new Date(submissions[0].gradedAt).toLocaleString()}
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
          
          <Col md={4}>
            {/* Status card */}
            <Card className="mb-4">
              <Card.Header className={`bg-${status.variant} text-white`}>
                <h2 className="h5 mb-0">Submission Status</h2>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <i className={`bi ${status.icon} me-2 fs-4 text-${status.variant}`}></i>
                  <div>
                    <div className="fw-bold">{status.text}</div>
                    <div className="text-muted small">
                      {isSubmissionClosed 
                        ? 'Submission period has ended' 
                        : `Due ${new Date(assessment.dueDate).toLocaleString()}`
                      }
                    </div>
                  </div>
                </div>
                
                {!isSubmissionClosed && (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    You have {Math.ceil((new Date(assessment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days left to submit.
                  </div>
                )}
                
                {isSubmissionClosed && assessment.allowLateSubmissions && !hasSubmitted && (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Late submissions are accepted with penalty.
                  </div>
                )}
              </Card.Body>
            </Card>
            
            {/* Assessment info */}
            <Card className="mb-4">
              <Card.Header>
                <h2 className="h5 mb-0">Assessment Information</h2>
              </Card.Header>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <div className="fw-bold">Type</div>
                  <div>{assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}</div>
                </ListGroup.Item>
                <ListGroup.Item>
                  <div className="fw-bold">Points</div>
                  <div>{assessment.points} points</div>
                </ListGroup.Item>
                <ListGroup.Item>
                  <div className="fw-bold">Due Date</div>
                  <div>{new Date(assessment.dueDate).toLocaleString()}</div>
                </ListGroup.Item>
                <ListGroup.Item>
                  <div className="fw-bold">Created By</div>
                  <div>{assessment.createdBy || course?.instructor}</div>
                </ListGroup.Item>
                {assessment.allowLateSubmissions && (
                  <ListGroup.Item className="text-warning">
                    <i className="bi bi-clock-history me-1"></i>
                    Late submissions allowed
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  
  // Instructor view
  return (
    <Container className="py-4">
      {/* Navigation breadcrumbs */}
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          className="me-2" 
          size="sm"
          onClick={() => course 
            ? navigate(`/courses/${course.id}`) 
            : navigate('/courses')
          }
        >
          <i className="bi bi-arrow-left me-1"></i>
          Back to {course ? course.title : 'Courses'}
        </Button>
      </div>
      
      {/* Assessment header */}
      <Row className="mb-4">
        <Col>
          <h1>{assessment.title}</h1>
          <div className="d-flex flex-wrap align-items-center">
            <Badge bg="secondary" className="me-2">{assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}</Badge>
            <Badge bg="primary" className="me-2">{assessment.points} Points</Badge>
            <span className="text-muted me-3">Due: {new Date(assessment.dueDate).toLocaleString()}</span>
            {isSubmissionClosed ? (
              <Badge bg="danger">Closed</Badge>
            ) : (
              <Badge bg="success">Open</Badge>
            )}
          </div>
        </Col>
        <Col xs="auto">
          <Button 
            variant="outline-primary" 
            onClick={() => navigate(`/courses/${assessment.courseId}/assessments/${assessmentId}/edit`)}
          >
            <i className="bi bi-pencil me-1"></i>
            Edit Assessment
          </Button>
        </Col>
      </Row>
      
      {/* Instructor tabs */}
      <Tab.Container 
        activeKey={activeTab} 
        onSelect={(key) => setActiveTab(key)}
      >
        <Row>
          <Col>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="details">
                  <i className="bi bi-info-circle me-1"></i>
                  Assessment Details
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="submissions">
                  <i className="bi bi-file-earmark-check me-1"></i>
                  Submissions
                  {submissions.length > 0 && (
                    <Badge bg="primary" pill className="ms-1">
                      {submissions.length}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="files">
                  <i className="bi bi-folder me-1"></i>
                  Files
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>
        
        <Row>
          <Col>
            <Tab.Content>
              {/* Details tab */}
              <Tab.Pane eventKey="details">
                <Row>
                  <Col md={8}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2 className="h5 mb-0">Assessment Description</h2>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-4">
                          {assessment.description}
                        </div>
                        
                        {assessment.instructions && (
                          <div className="mt-4">
                            <h3 className="h6">Instructions</h3>
                            <div className="p-3 bg-light rounded">
                              {assessment.instructions}
                            </div>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={4}>
                    {/* Assessment statistics */}
                    <Card className="mb-4">
                      <Card.Header>
                        <h2 className="h5 mb-0">Assessment Statistics</h2>
                      </Card.Header>
                      <ListGroup variant="flush">
                        <ListGroup.Item>
                          <div className="d-flex justify-content-between">
                            <span>Total Submissions</span>
                            <strong>{submissions.length}</strong>
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="d-flex justify-content-between">
                            <span>Submission Rate</span>
                            <strong>{calculateSubmissionRate()}</strong>
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="d-flex justify-content-between">
                            <span>Average Score</span>
                            <strong>{calculateClassAverage()}</strong>
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="d-flex justify-content-between">
                            <span>Graded Submissions</span>
                            <strong>
                              {submissions.filter(sub => sub.score !== undefined).length} / {submissions.length}
                            </strong>
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card>
                    
                    {/* Assessment info */}
                    <Card className="mb-4">
                      <Card.Header>
                        <h2 className="h5 mb-0">Assessment Information</h2>
                      </Card.Header>
                      <ListGroup variant="flush">
                        <ListGroup.Item>
                          <div className="fw-bold">Type</div>
                          <div>{assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}</div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="fw-bold">Points</div>
                          <div>{assessment.points} points</div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="fw-bold">Due Date</div>
                          <div>{new Date(assessment.dueDate).toLocaleString()}</div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="fw-bold">Created On</div>
                          <div>{new Date(assessment.createdAt).toLocaleDateString()}</div>
                        </ListGroup.Item>
                        {assessment.allowLateSubmissions && (
                          <ListGroup.Item className="text-warning">
                            <i className="bi bi-clock-history me-1"></i>
                            Late submissions allowed
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>
              
              {/* Submissions tab */}
              <Tab.Pane eventKey="submissions">
                <Card>
                  <Card.Header>
                    <h2 className="h5 mb-0">Student Submissions</h2>
                  </Card.Header>
                  <Card.Body>
                    {submissions.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="bi bi-file-earmark-x fs-3 text-muted"></i>
                        <p className="mt-2 text-muted">No submissions yet.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Submission Date</th>
                              <th>Status</th>
                              <th>Score</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submissions.map(submission => (
                              <tr key={submission.id}>
                                <td>{submission.studentName}</td>
                                <td>{new Date(submission.submissionTime).toLocaleString()}</td>
                                <td>
                                  {submission.score !== undefined ? (
                                    <Badge bg="success">Graded</Badge>
                                  ) : (
                                    <Badge bg="warning">Pending</Badge>
                                  )}
                                  {new Date(submission.submissionTime) > new Date(assessment.dueDate) && (
                                    <Badge bg="danger" className="ms-1">Late</Badge>
                                  )}
                                </td>
                                <td>
                                  {submission.score !== undefined ? (
                                    <span className={submission.score >= (assessment.points * 0.6) ? 'text-success' : 'text-danger'}>
                                      {submission.score} / {assessment.points}
                                    </span>
                                  ) : (
                                    <span className="text-muted">Not graded</span>
                                  )}
                                </td>
                                <td>
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="me-1"
                                    onClick={() => handleOpenGradeModal(submission)}
                                  >
                                    {submission.score !== undefined ? 'Edit Grade' : 'Grade'}
                                  </Button>
                                  <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={() => window.open(submission.fileUrl, '_blank')}
                                    disabled={!submission.fileUrl}
                                  >
                                    View
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              {/* Files tab */}
              <Tab.Pane eventKey="files">
                <Card>
                  <Card.Header>
                    <h2 className="h5 mb-0">Assessment Files</h2>
                  </Card.Header>
                  <Card.Body>
                    <AssessmentFiles 
                      assessmentId={assessmentId}
                      courseId={assessment.courseId}
                      dueDate={assessment.dueDate}
                      isSubmissionAllowed={true} // Instructors can always upload files
                    />
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
      
      {/* Grading Modal */}
      <Modal show={showGradeModal} onHide={() => setShowGradeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Grade Submission - {selectedSubmission?.studentName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {gradingError && (
            <Alert variant="danger" className="mb-3">
              {gradingError}
            </Alert>
          )}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Score (out of {assessment.points})</Form.Label>
              <Form.Control 
                type="number" 
                min="0" 
                max={assessment.points}
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                isInvalid={score > assessment.points}
              />
              <Form.Control.Feedback type="invalid">
                Score cannot exceed maximum points.
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Passing threshold: {Math.round(assessment.points * 0.6)} points
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Feedback</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to the student about their submission"
              />
              <Form.Text className="text-muted">
                Good feedback helps students understand their performance and how to improve.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowGradeModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitGrade}
            disabled={submittingGrade || score > assessment.points}
          >
            {submittingGrade ? (
              <>
                <Spinner 
                  as="span" 
                  animation="border" 
                  size="sm" 
                  className="me-1"
                />
                Saving...
              </>
            ) : (
              'Save Grade'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AssessmentDetail;
