using System;
using System.ComponentModel.DataAnnotations;

namespace EduSync.Api.DTOs
{
    /// <summary>
    /// Data transfer object for creating a new course
    /// </summary>
    public class CreateCourseDto
    {
        /// <summary>
        /// The title of the course
        /// </summary>
        [Required(ErrorMessage = "Course title is required")]
        [StringLength(200, ErrorMessage = "Title cannot be longer than 200 characters")]
        public string Title { get; set; } = string.Empty;
        
        /// <summary>
        /// A detailed description of the course
        /// </summary>
        [StringLength(1000, ErrorMessage = "Description cannot be longer than 1000 characters")]
        public string Description { get; set; } = string.Empty;
        
        /// <summary>
        /// URL to the course media/thumbnail image
        /// </summary>
        public string? MediaUrl { get; set; }
    }
}

