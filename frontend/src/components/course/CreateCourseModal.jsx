import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

const CreateCourseModal = ({ 
  show, 
  handleClose, 
  course = null, 
  onSave 
}) => {
  // Determine if we're editing or creating a new course
  const isEditMode = !!course;
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner',
    startDate: '',
    endDate: '',
    maxStudents: 30,
    isPublished: false
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // API state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Load course data when editing
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        level: course.level || 'Beginner',
        startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
        endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '',
        maxStudents: course.maxStudents || 30,
        isPublished: course.isPublished || false
      });
    } else {
      // Reset form when opening in create mode
      setFormData({
        title: '',
        description: '',
        category: '',
        level: 'Beginner',
        startDate: '',
        endDate: '',
        maxStudents: 30,
        isPublished: false
      });
    }
    
    // Reset states when modal is opened
    setErrors({});
    setApiError('');
    setSuccessMessage('');
  }, [course, show]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    // Date validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end < start) {
        newErrors.endDate = 'End date cannot be before the start date';
      }
    }
    
    // Student limit validation
    if (formData.maxStudents < 1) {
      newErrors.maxStudents = 'Maximum students must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setApiError('');
    setSuccessMessage('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the parent component's onSave function with the form data
      await onSave({
        ...formData,
        id: isEditMode ? course.id : undefined
      });
      
      setSuccessMessage(isEditMode 
        ? 'Course updated successfully!' 
        : 'Course created successfully!'
      );
      
      // Close the modal after a brief delay to show the success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving course:', error);
      setApiError(error.message || 'Failed to save the course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      backdrop="static"
      size="lg"
      centered
    >
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditMode ? 'Edit Course' : 'Create New Course'}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {apiError && (
            <Alert variant="danger" className="mb-3">
              {apiError}
            </Alert>
          )}
          
          {successMessage && (
            <Alert variant="success" className="mb-3">
              {successMessage}
            </Alert>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Title <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              isInvalid={!!errors.title}
              placeholder="Enter course title"
              disabled={isSubmitting}
            />
            <Form.Control.Feedback type="invalid">
              {errors.title}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Description <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              isInvalid={!!errors.description}
              placeholder="Enter course description"
              disabled={isSubmitting}
            />
            <Form.Control.Feedback type="invalid">
              {errors.description}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Category <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              isInvalid={!!errors.category}
              placeholder="E.g., Programming, Design, Mathematics"
              disabled={isSubmitting}
            />
            <Form.Control.Feedback type="invalid">
              {errors.category}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Level</Form.Label>
            <Form.Select
              name="level"
              value={formData.level}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </Form.Select>
          </Form.Group>
          
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  isInvalid={!!errors.startDate}
                  disabled={isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.startDate}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  isInvalid={!!errors.endDate}
                  disabled={isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.endDate}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>
          
          <Form.Group className="mb-3">
            <Form.Label>Maximum Students</Form.Label>
            <Form.Control
              type="number"
              name="maxStudents"
              value={formData.maxStudents}
              onChange={handleChange}
              isInvalid={!!errors.maxStudents}
              min="1"
              max="999"
              disabled={isSubmitting}
            />
            <Form.Control.Feedback type="invalid">
              {errors.maxStudents}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="isPublished"
              label="Publish course immediately"
              checked={formData.isPublished}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <Form.Text className="text-muted">
              If unchecked, the course will be saved as a draft.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner 
                  as="span" 
                  animation="border" 
                  size="sm" 
                  className="me-2"
                />
                Saving...
              </>
            ) : (
              isEditMode ? 'Update Course' : 'Create Course'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateCourseModal;

