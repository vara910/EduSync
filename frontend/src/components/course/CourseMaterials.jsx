import React, { useState, useEffect } from 'react';
import { Card, Accordion, Alert, Spinner, Tab, Nav, Badge } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import FileUploader from '../common/FileUploader';
import CourseService from '../../services/course.service';

/**
 * Course materials management component
 * Displays and manages course materials, allowing instructors to upload and delete files
 */
const CourseMaterials = ({ courseId }) => {
  // State management
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  
  // Get current user role from Redux store
  const { role } = useSelector(state => state.auth);
  const isInstructor = role === 'Instructor';
  
  // Material categories and accepted file types
  const materialCategories = {
    'lectures': {
      title: 'Lecture Materials',
      description: 'Slides, notes, and handouts from lectures',
      acceptedTypes: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain',
      icon: 'bi-mortarboard'
    },
    'assignments': {
      title: 'Assignments',
      description: 'Homework, projects, and other assignments',
      acceptedTypes: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain',
      icon: 'bi-journal-check'
    },
    'readings': {
      title: 'Reading Materials',
      description: 'Required and supplementary readings',
      acceptedTypes: 'application/pdf,application/epub+zip,text/plain',
      icon: 'bi-book'
    },
    'media': {
      title: 'Media Resources',
      description: 'Videos, audio recordings, and images',
      acceptedTypes: 'video/*,audio/*,image/*',
      icon: 'bi-film'
    },
    'software': {
      title: 'Software & Code',
      description: 'Software tools, code samples, and programming resources',
      acceptedTypes: 'application/zip,application/x-7z-compressed,application/java-archive,text/plain,application/x-javascript',
      icon: 'bi-code-square'
    },
    'other': {
      title: 'Other Resources',
      description: 'Additional course materials',
      acceptedTypes: '*',
      icon: 'bi-folder'
    }
  };
  
  // Fetch materials on component mount
  useEffect(() => {
    console.log('CourseMaterials: useEffect triggered with courseId:', courseId);
    if (courseId) {
      fetchMaterials();
    } else {
      console.warn('CourseMaterials: No courseId provided, skipping material fetch');
      setMaterials([]);
      setLoading(false);
    }
  }, [courseId]); // fetchMaterials is defined outside, so we accept the warning
  
  // Fetch course materials
  const fetchMaterials = async () => {
    console.log('CourseMaterials: Fetching materials for courseId:', courseId);
    setLoading(true);
    setError(null);
    
    if (!courseId) {
      console.error('CourseMaterials: Cannot fetch materials - courseId is missing');
      setError('Course ID is required to load materials.');
      setLoading(false);
      return;
    }
    
    try {
      // Use the dedicated getMaterials method instead of getCourseById
      console.log('CourseMaterials: Calling CourseService.getMaterials');
      const response = await CourseService.getMaterials(courseId);
      console.log('CourseMaterials: getMaterials response:', response);
      
      // The API now returns an array of materials directly
      if (response && Array.isArray(response)) {
        console.log(`CourseMaterials: Setting ${response.length} materials`);
        setMaterials(response);
      } else if (response && typeof response === 'object' && response.materials && Array.isArray(response.materials)) {
        // Handle case where API returns { materials: [] } format
        console.log(`CourseMaterials: Setting ${response.materials.length} materials from nested object`);
        setMaterials(response.materials);
      } else {
        // Handle unexpected response format
        console.warn('CourseMaterials: Unexpected materials response format:', response);
        setMaterials([]);
      }
    } catch (err) {
      console.error('CourseMaterials: Error fetching course materials:', err);
      let errorMessage = 'Failed to load course materials. Please try again later.';
      
      if (err.response) {
        // Add more specific error information if available
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        
        if (err.response.status === 404) {
          errorMessage = 'No materials found for this course.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to view these materials.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file upload
  // Note: FileUploader calls onUpload with (file, resourceId, resourceType, updateProgress)
  const handleUploadMaterial = async (file, resourceId, resourceType, updateProgress) => {
    console.log('CourseMaterials: Upload initiated', {
      file: file.name,
      size: file.size,
      resourceId,
      resourceType,
      courseId
    });
    
    setUploadError(null);
    
    try {
      // Get the active tab/category
      const activeCategory = document.querySelector('.nav-tabs .active')?.getAttribute('data-rb-event-key') || 'other';
      console.log('CourseMaterials: Detected active category tab:', activeCategory);
      
      // Call the CourseService method to upload the material - use courseId from props
      const result = await CourseService.uploadCourseMaterial(courseId, file, { 
        category: activeCategory,
        onUploadProgress: updateProgress
      });
      
      console.log('CourseMaterials: Upload successful, result:', result);
      
      // Refresh the entire materials list instead of just adding the new one
      // This ensures we have the most up-to-date data from the server
      console.log('CourseMaterials: Refreshing material list after upload');
      await fetchMaterials();
      
      return result;
    } catch (err) {
      console.error('CourseMaterials: Error uploading material:', err);
      let errorMessage = 'Failed to upload material. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setUploadError(errorMessage);
      throw err;
    }
  };
  
  // Handle file deletion
  const handleDeleteMaterial = async (fileId, resourceId) => {
    console.log('CourseMaterials: Delete initiated', { fileId, resourceId, courseId });
    setDeleteError(null);
    
    try {
      // Use the dedicated deleteMaterial method - use courseId from props
      await CourseService.deleteMaterial(courseId, fileId);
      console.log('CourseMaterials: File deleted successfully');
      
      // Refresh the entire materials list after deletion
      // This ensures we have the most up-to-date data from the server
      console.log('CourseMaterials: Refreshing material list after deletion');
      await fetchMaterials();
      
      return true;
    } catch (err) {
      console.error('CourseMaterials: Error deleting material:', err);
      let errorMessage = 'Failed to delete material. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setDeleteError(errorMessage);
      throw err;
    }
  };
  
  // Organize materials by category
  const getMaterialsByCategory = (category) => {
    const result = materials.filter(material => material.category === category);
    console.log(`CourseMaterials: Category ${category} has ${result.length} materials`);
    return result;
  };
  
  // Get file extension icon
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const icons = {
      pdf: 'bi-file-earmark-pdf',
      doc: 'bi-file-earmark-word',
      docx: 'bi-file-earmark-word',
      ppt: 'bi-file-earmark-slides',
      pptx: 'bi-file-earmark-slides',
      xls: 'bi-file-earmark-excel',
      xlsx: 'bi-file-earmark-excel',
      txt: 'bi-file-earmark-text',
      jpg: 'bi-file-earmark-image',
      jpeg: 'bi-file-earmark-image',
      png: 'bi-file-earmark-image',
      mp4: 'bi-file-earmark-play',
      mp3: 'bi-file-earmark-music',
      zip: 'bi-file-earmark-zip',
    };
    
    return icons[extension] || 'bi-file-earmark';
  };
  
  // Show loading spinner
  if (loading && materials.length === 0) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" variant="primary" />
        <p className="mt-2">Loading course materials...</p>
      </div>
    );
  }
  
  console.log('CourseMaterials: Rendering with', materials.length, 'total materials');
  
  return (
    <div className="course-materials">
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
      
      {/* Materials tabs */}
      <Tab.Container defaultActiveKey="lectures">
        <Nav variant="tabs" className="mb-3">
          {Object.entries(materialCategories).map(([key, category]) => (
            <Nav.Item key={key}>
              <Nav.Link eventKey={key}>
                <i className={`bi ${category.icon} me-1`}></i>
                {category.title}
                {getMaterialsByCategory(key).length > 0 && (
                  <Badge bg="primary" pill className="ms-1">
                    {getMaterialsByCategory(key).length}
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
        
        <Tab.Content>
          {Object.entries(materialCategories).map(([key, category]) => (
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
                  {/* File uploader - only visible to instructors */}
                  {isInstructor && (
                    <FileUploader
                      onUpload={handleUploadMaterial}
                      onDelete={handleDeleteMaterial}
                      acceptedFileTypes={category.acceptedTypes}
                      maxFileSize={50 * 1024 * 1024} // 50MB
                      existingFiles={getMaterialsByCategory(key)}
                      resourceId={courseId}
                      resourceType="course"
                    />
                  )}
                  
                  {/* Display when no materials are available */}
                  {!isInstructor && getMaterialsByCategory(key).length === 0 && (
                    <div className="text-center py-4">
                      <i className="bi bi-folder-x fs-3 text-muted"></i>
                      <p className="mt-2 text-muted">No {category.title.toLowerCase()} are available yet.</p>
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

CourseMaterials.propTypes = {
  courseId: PropTypes.string.isRequired
};

export default CourseMaterials;

