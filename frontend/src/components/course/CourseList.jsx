import React from 'react';
import { useSelector } from 'react-redux';
import { Button, Card, Row, Col, Badge } from 'react-bootstrap';

const CourseList = ({ courses = [], onEdit, onDelete, onView }) => {
  // Get auth state from Redux
  const { role } = useSelector(state => state.auth);
  const isInstructor = () => role === 'Instructor';

  // Helper to ensure we always use the correct ID property
  const getCourseId = (course) => {
    return course.courseId || course.id;
  };

  // Placeholder for empty state
  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-5">
        <h3>No courses available</h3>
        {isInstructor() && (
          <Button 
            variant="primary" 
            className="mt-3"
            onClick={() => onEdit()}
          >
            Create Your First Course
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h2>Available Courses</h2>
        </Col>
        {isInstructor() && (
          <Col className="text-end">
            <Button 
              variant="primary"
              onClick={() => onEdit()}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create Course
            </Button>
          </Col>
        )}
      </Row>

      <Row xs={1} md={2} lg={3} className="g-4">
        {courses.map(course => (
          <Col key={getCourseId(course)}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="d-flex justify-content-between">
                <Badge bg="primary">{course.category || 'General'}</Badge>
                {isInstructor() && (
                  <div className="course-actions">
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="me-1"
                      onClick={() => onEdit(course)}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => onDelete(getCourseId(course))}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Body 
                className="cursor-pointer" 
                onClick={() => onView(course)}
              >
                <Card.Title>{course.title}</Card.Title>
                <Card.Text>{course.description}</Card.Text>
              </Card.Body>
              <Card.Footer className="text-muted">
                <small>Instructor: {course.instructor || course.instructorName}</small>
                <div className="mt-2">
                  <Badge bg="info" className="me-1">{course.students?.length || 0} Students</Badge>
                  <Badge bg="secondary">{course.level || 'N/A'}</Badge>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default CourseList;
