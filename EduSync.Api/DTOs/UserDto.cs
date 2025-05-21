using System;

namespace EduSync.Api.DTOs
{
    /// <summary>
    /// Data transfer object for user information
    /// </summary>
    public class UserDto
    {
        /// <summary>
        /// Unique identifier for the user
        /// </summary>
        public Guid UserId { get; set; }
        
        /// <summary>
        /// User's full name
        /// </summary>
        public string Name { get; set; } = string.Empty;
        
        /// <summary>
        /// User's email address
        /// </summary>
        public string Email { get; set; } = string.Empty;
        
        /// <summary>
        /// Role of the user (Student or Instructor)
        /// </summary>
        public string Role { get; set; } = string.Empty;
        
        /// <summary>
        /// When the user's account was created
        /// </summary>
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// When the user last logged in
        /// </summary>
        public DateTime? LastLogin { get; set; }
        
        // Enrollment information (when used in course context)
        
        /// <summary>
        /// When the student enrolled in the course (if applicable)
        /// </summary>
        public DateTime? EnrollmentDate { get; set; }
        
        /// <summary>
        /// Student's progress through the course (0-100)
        /// </summary>
        public int Progress { get; set; }
        
        /// <summary>
        /// Status of enrollment (Active, Completed, Dropped)
        /// </summary>
        public string? EnrollmentStatus { get; set; }
        
        /// <summary>
        /// When the student completed the course (if applicable)
        /// </summary>
        public DateTime? CompletionDate { get; set; }
    }
}

