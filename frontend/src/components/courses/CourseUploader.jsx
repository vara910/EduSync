import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, ProgressBar, Form, ListGroup, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  // Videos
  'video/mp4',
  'video/mpeg',
  'video/webm',
  // Audio
  'audio/mpeg',
  'audio/wav',
  // Archives
  'application/zip',
  'application/x-rar-compressed'
];

const CourseUploader = ({ courseId, onMaterialsUpdated }) => {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    loadMaterials();
  }, [courseId]);
  
  const loadMaterials = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/materials`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMaterials(response.data);
    } catch (err) {
      console.error('Error loading materials:', err);
      setError('Failed to load course materials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      return false;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('File type not supported. Please upload a different file.');
      return false;
    }
    
    return true;
  };
  
  const handleFiles = async (files) => {
    setError('');
    setSuccessMessage('');
    
    if (files.length === 0) return;
    
    // Validate each file
    for (let i = 0; i < files.length; i++) {
      if (!validateFile(files[i])) {
        return;
      }
    }
    
    // Upload each file
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
    }
  };
  
  const uploadFile = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/courses/${courseId}/materials/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      setSuccessMessage(`${file.name} uploaded successfully!`);
      // Reload materials list
      loadMaterials();
      
      // Notify parent component if needed
      if (onMaterialsUpdated) {
        onMaterialsUpdated();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDeleteMaterial = async (fileName) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }
    
    try {
      await axios.delete(
        `${API_BASE_URL}/api/courses/${courseId}/materials/${encodeURIComponent(fileName)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setSuccessMessage(`${fileName} deleted successfully!`);
      // Reload materials list
      loadMaterials();
      
      // Notify parent component if needed
      if (onMaterialsUpdated) {
        onMaterialsUpdated();
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete file. Please try again.');
    }
  };
  
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'bi-file-earmark-pdf';
      case 'doc':
      case 'docx':
        return 'bi-file-earmark-word';
      case 'xls':
      case 'xlsx':
        return 'bi-file-earmark-excel';
      case 'ppt':
      case 'pptx':
        return 'bi-file-earmark-ppt';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'bi-file-earmark-image';
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'bi-file-earmark-play';
      case 'mp3':
      case 'wav':
        return 'bi-file-earmark-music';
      case 'zip':
      case 'rar':
        return 'bi-file-earmark-zip';
      default:
        return 'bi-file-earmark';
    }
  };
  
  return (
    <Card className="course-uploader mb-4">
      <Card.Header>
        <h5 className="mb-0">Course Materials</h5>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}
        
        <div 
          className={`upload-area p-4 mb-4 text-center border rounded ${dragActive ? 'border-primary' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <i className="bi bi-cloud-upload fs-2 mb-2"></i>
          <h5>Drag and drop files here</h5>
          <p className="text-muted">or</p>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Control 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileInput}
              disabled={isUploading}
              multiple
            />
          </Form.Group>
          <small className="text-muted d-block mt-2">
            Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB<br />
            Supported file types: Documents, Images, Videos, Audio, Archives
          </small>
          
          {isUploading && (
            <div className="mt-3">
              <ProgressBar 
                now={uploadProgress} 
                label={`${uploadProgress}%`}
                animated
              />
              <small className="text-muted mt-1 d-block">Uploading...</small>
            </div>
          )}
        </div>
        
        <h6 className="mb-3">Uploaded Materials</h6>
        
        {isLoading ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading materials...</p>
          </div>
        ) : materials.length > 0 ? (
          <ListGroup>
            {materials.map((material, index) => (
              <ListGroup.Item 
                key={index}
                className="d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center">
                  <i className={`bi ${getFileIcon(material.fileName)} fs-4 me-3`}></i>
                  <div>
                    <div className="fw-bold">{material.fileName}</div>
                    <small className="text-muted">
                      {(material.size / 1024 / 1024).toFixed(2)} MB • 
                      {new Date(material.lastModified).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <div>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="me-2"
                    href={material.url}
                    target="_blank"
                  >
                    <i className="bi bi-eye"></i> View
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleDeleteMaterial(material.fileName)}
                  >
                    <i className="bi bi-trash"></i> Delete
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <Alert variant="info" className="text-center">
            No materials have been uploaded for this course yet.
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

CourseUploader.propTypes = {
  courseId: PropTypes.string.isRequired,
  onMaterialsUpdated: PropTypes.func
};

export default CourseUploader;

