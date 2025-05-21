using System;
using System.Collections.Generic;

namespace EduSync.Api.DTOs
{
    /// <summary>
    /// Data transfer object for course information
    /// </summary>
    public class CourseDto
    {
        /// <summary>
        /// Unique identifier for the course
        /// </summary>
        public Guid CourseId { get; set; }
        
        /// <summary>
        /// Title of the course
        /// </summary>
        public string Title { get; set; } = string.Empty;
        
        /// <summary>
        /// Detailed description of the course
        /// </summary>
        public string Description { get; set; } = string.Empty;
        
        /// <summary>
        /// Instructor's name
        /// </summary>
        public string InstructorName { get; set; } = string.Empty;
        
        /// <summary>
        /// Instructor's ID
        /// </summary>
        public Guid? InstructorId { get; set; }
        
        /// <summary>
        /// URL to the main course media/image
        /// </summary>
        public string? MediaUrl { get; set; }
        
        /// <summary>
        /// When the course was created
        /// </summary>
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// When the course was last updated
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
        
        /// <summary>
        /// Number of students enrolled in the course
        /// </summary>
        public int EnrollmentCount { get; set; }
        
        // Enrollment-specific properties (when retrieved for a specific student)
        
        /// <summary>
        /// When the student enrolled in the course (null if not enrolled)
        /// </summary>
        public DateTime? EnrollmentDate { get; set; }
        
        /// <summary>
        /// Student's progress through the course (0-100)
        /// </summary>
        public int Progress { get; set; }
        
        /// <summary>
        /// When the student last accessed the course
        /// </summary>
        public DateTime? LastAccessed { get; set; }
        
        /// <summary>
        /// Status of enrollment (Active, Completed, Dropped)
        /// </summary>
        public string? EnrollmentStatus { get; set; }
        
        /// <summary>
        /// When the student completed the course (if applicable)
        /// </summary>
        public DateTime? CompletionDate { get; set; }
        
        /// <summary>
        /// Number of assessments in the course
        /// </summary>
        public int AssessmentCount { get; set; }
        
        /// <summary>
        /// List of materials/resources available in the course
        /// </summary>
        public List<CourseMaterialDto>? Materials { get; set; }
    }
    
    /// <summary>
    /// Data transfer object for course material information
    /// </summary>
    public class CourseMaterialDto
    {
        /// <summary>
        /// Filename of the material
        /// </summary>
        public string FileName { get; set; } = string.Empty;
        
        /// <summary>
        /// URL to access the material
        /// </summary>
        public string Url { get; set; } = string.Empty;
        
        /// <summary>
        /// Size of the file in bytes
        /// </summary>
        public long Size { get; set; }
        
        /// <summary>
        /// Type of content (PDF, video, etc.)
        /// </summary>
        public string ContentType { get; set; } = string.Empty;
        
        /// <summary>
        /// When the material was uploaded or last modified
        /// </summary>
        public DateTimeOffset LastModified { get; set; }
    }
}

