import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  ProgressBar, 
  Button, 
  Form, 
  Alert, 
  Badge, 
  Spinner,
  Row,
  Col,
  ListGroup
} from 'react-bootstrap';
import PropTypes from 'prop-types';

/**
 * Reusable file uploader component with drag-and-drop support
 */
const FileUploader = ({
  onUpload,
  onDelete,
  acceptedFileTypes = '*',
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  showPreviews = true,
  existingFiles = [],
  resourceId = null,
  resourceType = 'course', // 'course' or 'assessment'
  disabled = false
}) => {
  // Component state
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [existingFilesState, setExistingFilesState] = useState(existingFiles || []);

  // References
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // Update existing files when prop changes
  useEffect(() => {
    setExistingFilesState(existingFiles || []);
  }, [existingFiles]);

  // Helper functions to get file type icons and preview types
  const getFileTypeIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const fileTypeIcons = {
      // Documents
      pdf: 'bi-file-earmark-pdf',
      doc: 'bi-file-earmark-word',
      docx: 'bi-file-earmark-word',
      txt: 'bi-file-earmark-text',
      
      // Spreadsheets
      xls: 'bi-file-earmark-excel',
      xlsx: 'bi-file-earmark-excel',
      csv: 'bi-file-earmark-spreadsheet',
      
      // Presentations
      ppt: 'bi-file-earmark-slides',
      pptx: 'bi-file-earmark-slides',
      
      // Images
      jpg: 'bi-file-earmark-image',
      jpeg: 'bi-file-earmark-image',
      png: 'bi-file-earmark-image',
      gif: 'bi-file-earmark-image',
      svg: 'bi-file-earmark-image',
      
      // Audio/Video
      mp3: 'bi-file-earmark-music',
      wav: 'bi-file-earmark-music',
      mp4: 'bi-file-earmark-play',
      avi: 'bi-file-earmark-play',
      
      // Code
      js: 'bi-file-earmark-code',
      jsx: 'bi-file-earmark-code',
      ts: 'bi-file-earmark-code',
      tsx: 'bi-file-earmark-code',
      html: 'bi-file-earmark-code',
      css: 'bi-file-earmark-code',
      
      // Archives
      zip: 'bi-file-earmark-zip',
      rar: 'bi-file-earmark-zip',
      
      // Default
      default: 'bi-file-earmark'
    };
    
    return fileTypeIcons[extension] || fileTypeIcons.default;
  };
  
  const canPreview = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'pdf'].includes(extension);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

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
      const droppedFiles = Array.from(e.dataTransfer.files);
      processFiles(droppedFiles);
    }
  };

  // Process files: validate size and type
  const processFiles = (selectedFiles) => {
    setErrorMessage('');
    
    // Check if adding these files would exceed the max file limit
    if (files.length + selectedFiles.length > maxFiles) {
      setErrorMessage(`You can only upload up to ${maxFiles} files at a time.`);
      return;
    }
    
    const validFiles = selectedFiles.filter(file => {
      // Validate file size
      if (file.size > maxFileSize) {
        setErrorMessage(`File "${file.name}" exceeds the maximum size limit (${formatBytes(maxFileSize)}).`);
        return false;
      }
      
      // Validate file type if acceptedFileTypes is provided and not '*'
      if (acceptedFileTypes !== '*') {
        const fileType = file.type;
        const acceptedTypes = acceptedFileTypes.split(',');
        
        if (!acceptedTypes.some(type => {
          // Check if it's a wildcard match (e.g., 'image/*')
          if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return fileType.startsWith(`${category}/`);
          }
          // Exact match
          return type === fileType;
        })) {
          setErrorMessage(`File "${file.name}" has an unsupported file type.`);
          return false;
        }
      }
      
      return true;
    });
    
    // Add valid files to state
    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      
      // Initialize progress and status for each file
      validFiles.forEach(file => {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));
        
        setUploadStatus(prev => ({
          ...prev,
          [file.name]: 'pending'
        }));
      });
    }
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Handle file upload
  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMessage('Please select files to upload.');
      return;
    }
    
    setUploading(true);
    setErrorMessage('');
    
    const uploadPromises = files.map(async (file) => {
      try {
        // Create a mock progress updater
        const updateProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: percentCompleted
          }));
        };
        
        // Set status to uploading
        setUploadStatus(prev => ({
          ...prev,
          [file.name]: 'uploading'
        }));
        
        // Call the upload function passed via props
        await onUpload(file, resourceId, resourceType, updateProgress);
        
        // Set status to success
        setUploadStatus(prev => ({
          ...prev,
          [file.name]: 'success'
        }));
        
        return { file, success: true };
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        
        // Set status to error
        setUploadStatus(prev => ({
          ...prev,
          [file.name]: 'error'
        }));
        
        return { file, success: false, error };
      }
    });
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Handle results
    const failures = results.filter(result => !result.success);
    
    if (failures.length > 0) {
      setErrorMessage(`Failed to upload ${failures.length} files. Please try again.`);
    } else {
      // Remove successfully uploaded files from the queue
      setFiles([]);
      // Refresh the existing files list
      if (resourceId && typeof onUpload === 'function') {
        // Note: in a real app, you would fetch the updated file list from the server
      }
    }
    
    setUploading(false);
  };

  // Handle file removal from queue
  const handleRemoveFile = (fileName) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    
    // Clean up progress and status
    setUploadProgress(prev => {
      const { [fileName]: _, ...rest } = prev;
      return rest;
    });
    
    setUploadStatus(prev => {
      const { [fileName]: _, ...rest } = prev;
      return rest;
    });
  };

  // Handle existing file deletion
  const handleDeleteExistingFile = async (fileId) => {
    if (!onDelete || !resourceId) return;
    
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      try {
        await onDelete(fileId, resourceId, resourceType);
        
        // Remove from UI
        setExistingFilesState(prev => prev.filter(file => file.id !== fileId));
      } catch (error) {
        console.error('Error deleting file:', error);
        setErrorMessage('Failed to delete the file. Please try again.');
      }
    }
  };
  
  // Handle click on the drop area
  const handleDropAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Render preview for supported file types
  const renderPreview = (file) => {
    if (!showPreviews) return null;
    
    const isImage = file.type?.startsWith('image/');
    
    if (isImage) {
      return (
        <div className="file-preview mb-2">
          <img 
            src={file instanceof File ? URL.createObjectURL(file) : file.url} 
            alt={file.name}
            className="img-thumbnail"
            style={{ maxHeight: '100px', maxWidth: '100px' }}
          />
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="file-uploader">
      {/* Error message */}
      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
          {errorMessage}
        </Alert>
      )}
      
      {/* File drop area */}
      <div
        ref={dropAreaRef}
        className={`file-drop-area p-4 mb-3 text-center ${dragActive ? 'drag-active border-primary' : ''}`}
        style={{
          border: '2px dashed #ced4da',
          borderRadius: '0.25rem',
          backgroundColor: dragActive ? 'rgba(0,123,255,0.05)' : '#f8f9fa',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleDropAreaClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />
        
        <i className="bi bi-cloud-upload fs-1 text-primary mb-2"></i>
        <p className="mb-1">
          Drag & drop files here or click to browse
        </p>
        <p className="text-muted small mb-0">
          Max file size: {formatBytes(maxFileSize)} | Accepted types: {acceptedFileTypes === '*' ? 'All files' : acceptedFileTypes}
        </p>
        <p className="text-muted small">
          Maximum {maxFiles} file{maxFiles !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Upload queue */}
      {files.length > 0 && (
        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Upload Queue ({files.length})</span>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleUpload}
              disabled={uploading || disabled}
            >
              {uploading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-upload me-1"></i>
                  Upload All
                </>
              )}
            </Button>
          </Card.Header>
          <ListGroup variant="flush">
            {files.map((file, index) => (
              <ListGroup.Item key={`${file.name}-${index}`}>
                <Row className="align-items-center">
                  <Col xs={12} md={showPreviews ? 6 : 8} className="d-flex align-items-center">
                    <i className={`bi ${getFileTypeIcon(file.name)} me-2 fs-5`}></i>
                    <div className="text-truncate">
                      <div className="text-truncate">{file.name}</div>
                      <small className="text-muted">{formatBytes(file.size)}</small>
                    </div>
                  </Col>
                  
                  {showPreviews && (
                    <Col xs={12} md={2} className="text-center">
                      {renderPreview(file)}
                    </Col>
                  )}
                  
                  <Col xs={12} md={4}>
                    <div className="d-flex justify-content-end align-items-center h-100">
                      {/* Status badge */}
                      {uploadStatus[file.name] === 'pending' && (
                        <Badge bg="secondary" className="me-2">Pending</Badge>
                      )}
                      {uploadStatus[file.name] === 'uploading' && (
                        <Badge bg="info" className="me-2">Uploading</Badge>
                      )}
                      {uploadStatus[file.name] === 'success' && (
                        <Badge bg="success" className="me-2">Uploaded</Badge>
                      )}
                      {uploadStatus[file.name] === 'error' && (
                        <Badge bg="danger" className="me-2">Failed</Badge>
                      )}
                      
                      {/* Progress bar */}
                      {uploadStatus[file.name] === 'uploading' && (
                        <div className="flex-grow-1 mx-2">
                          <ProgressBar 
                            now={uploadProgress[file.name]} 
                            label={`${uploadProgress[file.name]}%`}
                            variant="primary"
                            animated
                          />
                        </div>
                      )}
                      
                      {/* Remove button */}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="ms-2"
                        onClick={() => handleRemoveFile(file.name)}
                        disabled={uploadStatus[file.name] === 'uploading' || disabled}
                      >
                        <i className="bi bi-x-lg"></i>
                      </Button>
                    </div>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}
      
      {/* Existing files */}
      {existingFilesState.length > 0 && (
        <Card>
          <Card.Header>
            <span>Existing Files ({existingFilesState.length})</span>
          </Card.Header>
          <ListGroup variant="flush">
            {existingFilesState.map((file) => (
              <ListGroup.Item key={file.id}>
                <Row className="align-items-center">
                  <Col xs={12} md={showPreviews ? 6 : 8} className="d-flex align-items-center">
                    <i className={`bi ${getFileTypeIcon(file.name)} me-2 fs-5`}></i>
                    <div className="text-truncate">
                      <div className="text-truncate">{file.name}</div>
                      <small className="text-muted">
                        {file.size ? formatBytes(file.size) : 'Unknown size'} | 
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </small>
                    </div>
                  </Col>
                  
                  {showPreviews && (
                    <Col xs={12} md={2} className="text-center">
                      {canPreview(file.name) && (
                        <div className="file-preview mb-2">
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="img-thumbnail"
                            style={{ maxHeight: '100px', maxWidth: '100px' }}
                          />
                        </div>
                      )}
                    </Col>
                  )}
                  
                  <Col xs={12} md={4}>
                    <div className="d-flex justify-content-end align-items-center h-100">
                      {/* Download button */}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        as="a"
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <i className="bi bi-download me-1"></i>
                        Download
                      </Button>
                      
                      {/* Delete button */}
                      {onDelete && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteExistingFile(file.id)}
                          disabled={disabled}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Delete
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}
    </div>
  );
};

FileUploader.propTypes = {
  onUpload: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  acceptedFileTypes: PropTypes.string,
  maxFileSize: PropTypes.number,
  maxFiles: PropTypes.number,
  showPreviews: PropTypes.bool,
  existingFiles: PropTypes.array,
  resourceId: PropTypes.string,
  resourceType: PropTypes.string,
  disabled: PropTypes.bool
};

export default FileUploader;
