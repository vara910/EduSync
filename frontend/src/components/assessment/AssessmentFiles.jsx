import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Alert, 
  Spinner, 
  Tab, 
  Nav, 
  Badge, 
  Button,
  Row,
  Col 
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import FileUploader from '../common/FileUploader';
import AssessmentService from '../../services/assessment.service';

/**
 * Assessment files management component
 * Handles different file operations for assessments based on user role
 */
const AssessmentFiles = ({ 
  assessmentId, 
  courseId, 
  dueDate, 
  isSubmissionAllowed = true 
}) => {
  // State management
  const [files, setFiles] = useState({
    instructions: [],
    resources: [],
    submissions: []
  });
  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  
  // Get current user info from Redux store
  const { user, role } = useSelector(state => state.auth);
  const isInstructor = role === 'Instructor';
  
  // Check if submission deadline has passed
  const isSubmissionClosed = new Date(dueDate) < new Date();
  
  // File category configurations
  const fileCategories = {
    'instructions': {
      title: 'Instructions & Questions',
      description: 'Assessment instructions and question papers',
      acceptedTypes: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain',
      icon: 'bi-file-text',
      // Only instructors can upload instructions
      canUpload: isInstructor
    },
    'resources': {
      title: 'Resources',
      description: 'Additional resources for completing the assessment',
      acceptedTypes: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,application/zip,text/plain',
      icon: 'bi-folder-fill',
      // Only instructors can upload resources
      canUpload: isInstructor
    },
    'submissions': {
      title: 'Submissions',
      description: 'Your assessment submissions',
      acceptedTypes: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,text/plain,image/*',
      icon: 'bi-upload',
      // Students can submit before the deadline if submission is allowed
      canUpload: !isInstructor && isSubmissionAllowed && !isSubmissionClosed
    }
  };
  
  // Fetch assessment files on component mount
  useEffect(() => {
    fetchAssessmentFiles();
  }, [assessmentId]);
  
  // Fetch assessment files
  const fetchAssessmentFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This would be extended in a real implementation with proper endpoints
      const assessmentData = await AssessmentService.getAssessmentById(assessmentId);
      
      // For this example, we're assuming the API returns files categorized
      if (assessmentData) {
        setFiles({
          instructions: assessmentData.instructions || [],
          resources: assessmentData.resources || [],
          // For students, only show their own submissions
          submissions: isInstructor 
            ? (assessmentData.submissions || [])
            : (assessmentData.submissions || []).filter(
                sub => sub.studentId === user.id
              )
        });
      }
    } catch (err) {
      console.error('Error fetching assessment files:', err);
      setError('Failed to load assessment files. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file upload for instructors
  const handleUploadFile = async (file, assessmentId, category, updateProgress) => {
    setUploadError(null);
    
    try {
      // In a real implementation, you would have a dedicated method in AssessmentService
      // For now, we'll simulate this
      // const result = await AssessmentService.uploadAssessmentFile(assessmentId, file, category, updateProgress);
      
      // For demo purposes, creating a mock result
      const result = {
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file), // This would come from the server in real app
        uploadDate: new Date().toISOString(),
        category: category,
        uploadedBy: user.name
      };
      
      // Update the state with the new file
      setFiles(prevFiles => ({
        ...prevFiles,
        [category]: [...prevFiles[category], result]
      }));
      
      return result;
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadError('Failed to upload file. Please try again.');
      throw err;
    }
  };
  
  // Handle file deletion
  const handleDeleteFile = async (fileId, assessmentId, category) => {
    setDeleteError(null);
    
    try {
      // In a real implementation, you would have a dedicated method
      // await AssessmentService.deleteAssessmentFile(assessmentId, fileId);
      
      // For demo, just update the state
      setFiles(prevFiles => ({
        ...prevFiles,
        [category]: prevFiles[category].filter(file => file.id !== fileId)
      }));
      
      return true;
    } catch (err) {
      console.error('Error deleting file:', err);
      setDeleteError('Failed to delete file. Please try again.');
      throw err;
    }
  };
  
  // Handle student submission
  const handleSubmitAssessment = async (file, assessmentId, category, updateProgress) => {
    setSubmissionLoading(true);
    setUploadError(null);
    setSubmissionSuccess(false);
    
    try {
      // In a real implementation, you would use a dedicated endpoint
      // const result = await AssessmentService.submitAssessment(assessmentId, file, updateProgress);
      
      // For demo purposes, creating a mock result
      const result = {
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadDate: new Date().toISOString(),
        category: 'submissions',
        studentId: user.id,
        studentName: user.name,
        submissionTime: new Date().toISOString(),
        status: 'Submitted'
      };
      
      // Update submissions list
      setFiles(prevFiles => ({
        ...prevFiles,
        submissions: [...prevFiles.submissions, result]
      }));
      
      setSubmissionSuccess(true);
      return result;
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setUploadError('Failed to submit assessment. Please try again.');
      throw err;
    } finally {
      setSubmissionLoading(false);
    }
  };
  
  // Generate submission status badges
  const getSubmissionStatus = () => {
    const hasSubmitted = files.submissions && files.submissions.length > 0;
    
    if (isSubmissionClosed) {
      if (hasSubmitted) {
        return <Badge bg="success">Submitted</Badge>;
      } else {
        return <Badge bg="danger">Missed</Badge>;
      }
    } else {
      if (hasSubmitted) {
        return <Badge bg="info">Submitted - Can Resubmit</Badge>;
      } else {
        return <Badge bg="warning">Pending</Badge>;
      }
    }
  };
  
  // Show loading spinner
  if (loading && Object.values(files).every(arr => arr.length === 0)) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" variant="primary" />
        <p className="mt-2">Loading assessment files...</p>
      </div>
    );
  }
  
  return (
    <div className="assessment-files">
      {/* Error alerts */}
      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}
      
      {uploadError && (
        <Alert variant="danger" className="mb-3" onClose={() => setUploadError(null)} dismissible>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {uploadError}
        </Alert>
      )}
      
      {deleteError && (
        <Alert variant="danger" className="mb-3" onClose={() => setDeleteError(null)} dismissible>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {deleteError}
        </Alert>
      )}
      
      {submissionSuccess && (
        <Alert variant="success" className="mb-3" onClose={() => setSubmissionSuccess(false)} dismissible>
          <i className="bi bi-check-circle-fill me-2"></i>
          Assessment submitted successfully!
        </Alert>
      )}
      
      {/* Assessment deadline info */}
      {!isInstructor && (
        <Card className="mb-3">
          <Card.Body>
            <Row className="align-items-center">
              <Col>
                <h5 className="mb-1">Submission Status</h5>
                <p className="mb-0">
                  Due: {new Date(dueDate).toLocaleString()}
                  {isSubmissionClosed && (
                    <Badge bg="danger" className="ms-2">Closed</Badge>
                  )}
                </p>
              </Col>
              <Col xs="auto">
                {getSubmissionStatus()}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {/* Files tabs */}
      <Tab.Container defaultActiveKey={!isInstructor ? "instructions" : "submissions"}>
        <Nav variant="tabs" className="mb-3">
          {Object.entries(fileCategories).map(([key, category]) => (
            // For instructors, show all tabs; for students, don't show empty submission tabs until due
            (isInstructor || key !== 'submissions' || files.submissions.length > 0 || !isSubmissionClosed) && (
              <Nav.Item key={key}>
                <Nav.Link eventKey={key}>
                  <i className={`bi ${category.icon} me-1`}></i>
                  {category.title}
                  {files[key] && files[key].length > 0 && (
                    <Badge bg="primary" pill className="ms-1">
                      {files[key].length}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
            )
          ))}
        </Nav>
        
        <Tab.Content>
          {Object.entries(fileCategories).map(([key, category]) => (
            <Tab.Pane eventKey={key} key={key}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <i className={`bi ${category.icon} me-2`}></i>
                    {category.title}
                  </h5>
                  <p className="mb-0 text-muted small">{category.description}</p>
                </Card.Header>
                <Card.Body>
                  {/* File uploader - only visible according to category permissions */}
                  {category.canUpload && (
                    <div className="mb-4">
                      {key === 'submissions' && !isInstructor && (
                        <Alert variant={isSubmissionClosed ? "danger" : "info"} className="mb-3">
                          {isSubmissionClosed ? (
                            <>
                              <i className="bi bi-exclamation-triangle-fill me-2"></i>
                              The deadline for this assessment has passed.
                            </>
                          ) : (
                            <>
                              <i className="bi bi-info-circle-fill me-2"></i>
                              Please upload your completed assessment. You can resubmit until the deadline.
                            </>
                          )}
                        </Alert>
                      )}
                      
                      <FileUploader
                        onUpload={(file, _, __, updateProgress) => 
                          key === 'submissions' && !isInstructor
                            ? handleSubmitAssessment(file, assessmentId, key, updateProgress)
                            : handleUploadFile(file, assessmentId, key, updateProgress)
                        }
                        onDelete={(fileId) => handleDeleteFile(fileId, assessmentId, key)}
                        acceptedFileTypes={category.acceptedTypes}
                        maxFileSize={50 * 1024 * 1024} // 50MB
                        existingFiles={files[key] || []}
                        resourceId={assessmentId}
                        resourceType="assessment"
                        disabled={submissionLoading}
                      />
                    </div>
                  )}
                  
                  {/* Display files without uploader for non-uploadable categories */}
                  {!category.canUpload && files[key] && files[key].length > 0 && (
                    <FileUploader
                      onUpload={() => {}} // Dummy function, not used
                      acceptedFileTypes={category.acceptedTypes}
                      existingFiles={files[key] || []}
                      resourceId={assessmentId}
                      resourceType="assessment"
                      disabled={true}
                    />
                  )}
                  
                  {/* Display when no files are available */}
                  {(!files[key] || files[key].length === 0) && (
                    <div className="text-center py-4">
                      <i className="bi bi-folder-x fs-3 text-muted"></i>
                      <p className="mt-2 text-muted">
                        {key === 'submissions' 
                          ? isInstructor 
                            ? 'No submissions yet.' 
                            : 'You have not submitted anything yet.'
                          : `No ${category.title.toLowerCase()} available yet.`
                        }
                      </p>
                      
                      {/* For students who haven't submitted and submission is allowed */}
                      {key === 'submissions' && !isInstructor && !isSubmissionClosed && (
                        <Button 
                          variant="primary" 
                          onClick={() => document.getElementById('file-upload-input')?.click()}
                        >
                          <i className="bi bi-upload me-2"></i>
                          Submit Now
                        </Button>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>
          ))}
        </Tab.Content>
      </Tab.Container>
    </div>
  );
};

AssessmentFiles.propTypes = {
  assessmentId: PropTypes.string.isRequired,
  courseId: PropTypes.string.isRequired,
  dueDate: PropTypes.string.isRequired,
  isSubmissionAllowed: PropTypes.bool
};

export default AssessmentFiles;
