import React from 'react';
import { Card, Badge, Button, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const CourseCard = ({ course, isEnrolled }) => {
  return (
    <Card className="h-100 shadow-sm course-card">
      <Card.Img 
        variant="top" 
        src={course.imageUrl || 'https://via.placeholder.com/300x150?text=Course+Image'} 
        alt={course.title}
      />
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="mb-0">{course.title}</Card.Title>
          {course.category && (
            <Badge bg="primary" pill>
              {course.category}
            </Badge>
          )}
        </div>
        
        <Card.Text className="text-muted small mb-3">
          {course.instructor?.name && (
            <span>Instructor: {course.instructor.name}</span>
          )}
        </Card.Text>
        
        <Card.Text className="course-description">
          {course.description}
        </Card.Text>
        
        {isEnrolled && course.progress !== undefined && (
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small">Progress</span>
              <span className="small">{course.progress}%</span>
            </div>
            <ProgressBar now={course.progress} variant="success" />
          </div>
        )}
      </Card.Body>
      <Card.Footer className="bg-white d-flex justify-content-between">
        {isEnrolled ? (
          <Button 
            as={Link} 
            to={`/courses/${course.courseId}`} 
            variant="primary"
          >
            Continue Learning
          </Button>
        ) : (
          <Button 
            as={Link} 
            to={`/courses/${course.courseId}`} 
            variant="outline-primary"
          >
            View Details
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    courseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    imageUrl: PropTypes.string,
    category: PropTypes.string,
    instructor: PropTypes.shape({
      name: PropTypes.string
    }),
    progress: PropTypes.number
  }).isRequired,
  isEnrolled: PropTypes.bool
};

CourseCard.defaultProps = {
  isEnrolled: false
};

export default CourseCard;

