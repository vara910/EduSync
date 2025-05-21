import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, ProgressBar, Alert, Form, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// This would come from your authentication context or Redux store
const useAuth = () => {
  // Placeholder - replace with your actual auth logic
  const [userRole, setUserRole] = useState('student'); // or 'instructor'
  
  // Simulating an auth function that would normally come from your auth service
  const getUserRole = () => userRole;
  const isInstructor = () => userRole === 'instructor';

  // For demo purposes only - toggle role
  const toggleRole = () => {
    setUserRole(prevRole => prevRole === 'student' ? 'instructor' : 'student');
  };

  return { getUserRole, isInstructor, toggleRole };
};

// Sample data - replace with actual API call response
const sampleMaterials = [
  {
    id: '1',
    name: 'React Fundamentals Slides.pdf',
    size: 2457600, // in bytes
    type: 'application/pdf',
    uploadedAt: '2025-05-10T09:30:00',
    uploadedBy: 'John Doe'
  },
  {
    id: '2',
    name: 'Week 1 - Introduction.pptx',
    size: 1843200,
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    uploadedAt: '2025-05-12T14:15:00',
    uploadedBy: 'John Doe'
  },
  {
    id: '3',
    name: 'JavaScript Cheat Sheet.pdf',
    size: 512000,
    type: 'application/pdf',
    uploadedAt: '2025-05-14T11:45:00',
    uploadedBy: 'Jane Smith'
  }
];

const MaterialUpload = ({ courseId }) => {
  const { isInstructor, toggleRole } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State for file upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // State for materials list
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Local storage configuration
  const LOCAL_STORAGE_CONFIG = {
    maxFileSize: 50 * 1024 * 1024, // 50MB to match backend
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png'
    ]
  };
  
  // Use the configuration
  const allowedTypes = LOCAL_STORAGE_CONFIG.allowedTypes;
  const maxFileSize = LOCAL_STORAGE_CONFIG.maxFileSize; // 50MB
  
  // Fetch materials on component mount
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        // Replace with actual API call
        // const response = await materialService.getMaterials(courseId);
        // setMaterials(response.data);
        
        // Using sample data for now
        setTimeout(() => {
          setMaterials(sampleMaterials);
          setLoading(false);
        }, 1000); // Simulate network delay
      } catch (err) {
        console.error('Error fetching materials:', err);
        setError('Failed to load course materials. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, [courseId]);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Process selected files
  const handleFiles = (fileList) => {
    const filesArray = Array.from(fileList);
    
    // Validate files
    const validFiles = filesArray.filter(file => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" is not an allowed file type. Please upload documents, presentations, spreadsheets, images, or zip files.`);
        return false;
      }
      
      // Check file size
      if (file.size > maxFileSize) {
        setError(`File "${file.name}" exceeds the maximum file size of 10MB.`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
      setError(null);
    }
  };

  // Remove file from selection
  const handleRemoveFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Reset file input
  const handleClearFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploadingFiles(true);
    const newProgress = {};
    selectedFiles.forEach((file, index) => {
      newProgress[index] = 0;
    });
    setUploadProgress(newProgress);
    
    try {
      // For each file, simulate an upload
      const uploadPromises = selectedFiles.map(async (file, index) => {
        // In a real application, use axios or fetch to upload the file
        // and track progress with the onUploadProgress option
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 5) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev => ({
            ...prev,
            [index]: progress
          }));
        }
        
        // Create a fake uploaded file object 
        // (in production this would come from the API response)
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Current User' // Would come from auth context in production
        };
      });
      
      // Wait for all uploads to complete
      const newMaterials = await Promise.all(uploadPromises);
      
      // Update materials list with new uploads
      setMaterials(prevMaterials => [...prevMaterials, ...newMaterials]);
      
      // Reset the file selection
      handleClearFiles();
    } catch (err) {
      console.error('Error uploading files:', err);
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to upload files. Please try again.';
      
      if (err.message && err.message.includes('exceeds the maximum allowed size')) {
        errorMessage = 'File size exceeds the maximum limit of 50MB.';
      } else if (err.message && err.message.includes('type is not supported')) {
        errorMessage = 'File type is not supported. Please upload allowed file types only.';
      }
      
      setError(errorMessage);
    } finally {
      setUploadingFiles(false);
    }
  };

  // Handle material deletion
  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }
    
    try {
      // Replace with actual API call
      // await materialService.deleteMaterial(courseId, materialId);
      console.log('Deleting material:', materialId);
      
      // Update local state
      setMaterials(prevMaterials => prevMaterials.filter(material => material.id !== materialId));
    } catch (err) {
      console.error('Error deleting material:', err);
      setError('Failed to delete the material. Please try again.');
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle file download
  const handleDownload = async (fileName) => {
    try {
      console.log(`Downloading file: ${fileName}`);
      
      // For local storage implementation
      if (courseId) {
        const response = await CourseService.getMaterial(courseId, fileName);
        
        // Create a blob from the response and trigger download
        const blob = new Blob([response], { type: response.contentType || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again.');
    }
  };

  // Get file icon based on type
  const getFileIcon = (type) => {
    if (type.includes('pdf')) {
      return 'bi-file-earmark-pdf';
    } else if (type.includes('word')) {
      return 'bi-file-earmark-word';
    } else if (type.includes('presentation')) {
      return 'bi-file-earmark-slides';
    } else if (type.includes('spreadsheet') || type.includes('excel')) {
      return 'bi-file-earmark-spreadsheet';
    } else if (type.includes('image')) {
      return 'bi-file-earmark-image';
    } else if (type.includes('zip')) {
      return 'bi-file-earmark-zip';
    } else if (type.includes('text')) {
      return 'bi-file-earmark-text';
    } else {
      return 'bi-file-earmark';
    }
  };

  // Get file color based on type
  const getFileColor = (type) => {
    if (type.includes('pdf')) {
      return 'danger';
    } else if (type.includes('word')) {
      return 'primary';
    } else if (type.includes('presentation')) {
      return 'warning';
    } else if (type.includes('spreadsheet') || type.includes('excel')) {
      return 'success';
    } else if (type.includes('image')) {
      return 'info';
    } else {
      return 'secondary';
    }
  };

  return (
    <div className="material-upload-container">
      {/* Upload Section (Instructors Only) */}
      {isInstructor() && (
        <Card className="mb-4">
          <Card.Header as="h5">Upload Course Materials</Card.Header>
          <Card.Body>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            {/* Drag and Drop Zone */}
            <div 
              className={`drag-drop-zone p-5 border rounded text-center mb-4 ${dragActive ? 'drag-active border-primary' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{
                background: dragActive ? 'rgba(0, 123, 255, 0.05)' : '#f8f9fa',
                borderStyle: 'dashed',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="bi bi-cloud-upload fs-1 mb-3 text-primary"></i>
              <h5>Drag and drop files here</h5>
              <p className="text-muted">or click to browse files</p>
              <Form.Control
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <small className="d-block mt-2 text-muted">
                Allowed types: PDF, Word, PowerPoint, Images, Text<br />
                Maximum file size: 50MB
              </small>
            </div>
            
            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="selected-files mb-4">
                <h6>Selected Files ({selectedFiles.length})</h6>
                <ListGroup>
                  {selectedFiles.map((file, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className={`bi ${getFileIcon(file.type)} me-2 text-${getFileColor(file.type)}`}></i>
                        <span className="text-truncate" style={{ maxWidth: '200px', display: 'inline-block' }}>
                          {file.name}
                        </span>
                        <small className="text-muted ms-2">({formatFileSize(file.size)})</small>
                      </div>
                      
                      {/* Upload Progress or Remove Button */}
                      {uploadingFiles ? (
                        <div style={{ width: '40%' }}>
                          <ProgressBar 
                            now={uploadProgress[index] || 0} 
                            label={`${uploadProgress[index] || 0}%`}
                            variant="success"
                          />
                        </div>
                      ) : (
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <i className="bi bi-x-circle"></i>
                        </Button>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                
                {/* Upload and Clear Buttons */}
                <div className="d-flex gap-2 mt-3">
                  <Button 
                    variant="primary" 
                    onClick={handleUpload}
                    disabled={uploadingFiles}
                  >
                    {uploadingFiles ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload me-2"></i>
                        Upload Files
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleClearFiles}
                    disabled={uploadingFiles}
                  >
                    <i className="bi bi-x me-2"></i>
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* Materials List Section */}
      <Card>
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          <span>Course Materials</span>
          {isInstructor() && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFiles}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Add Materials
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {loading && materials.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-folder2-open text-muted fs-1"></i>
              <p className="mt-2">No materials available for this course yet.</p>
              {isInstructor() && (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Add Your First Material
                </Button>
              )}
            </div>
          ) : (
            <ListGroup>
              {materials.map(material => (
                <ListGroup.Item 
                  key={material.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    <i className={`bi ${getFileIcon(material.type)} fs-3 me-3 text-${getFileColor(material.type)}`}></i>
                    <div>
                      <h6 className="mb-0">{material.name}</h6>
                      <div className="text-muted small">
                        <span>{formatFileSize(material.size)}</span>
                        <span className="mx-2">•</span>
                        <span>Uploaded {new Date(material.uploadedAt).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span>By {material.uploadedBy}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleDownload(material.name)}
                    >
                      <i className="bi bi-download"></i>
                    </Button>
                    {isInstructor() && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteMaterial(material.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
        <Card.Footer className="text-muted d-flex justify-content-between">
          <span>Total Files: {materials.length}</span>
          <span>
            Total Size: {formatFileSize(materials.reduce((total, m) => total + m.size, 0))}
          </span>
        </Card.Footer>
      </Card>
      
      {/* Role toggle button (for demo purposes only) */}
      <Button 
        variant="outline-secondary" 
        size="sm" 
        className="position-fixed bottom-0 end-0 m-3"
        onClick={toggleRole}
      >
        Toggle Role (Demo Only)
      </Button>
    </div>
  );
};

export default MaterialUpload;

