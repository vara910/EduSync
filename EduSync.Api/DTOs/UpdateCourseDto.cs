using System;
using System.ComponentModel.DataAnnotations;

namespace EduSync.Api.DTOs
{
    /// <summary>
    /// Data transfer object for updating an existing course
    /// </summary>
    public class UpdateCourseDto
    {
        /// <summary>
        /// The updated title of the course (optional)
        /// </summary>
        [StringLength(200, ErrorMessage = "Title cannot be longer than 200 characters")]
        public string? Title { get; set; }
        
        /// <summary>
        /// The updated description of the course (optional)
        /// </summary>
        [StringLength(1000, ErrorMessage = "Description cannot be longer than 1000 characters")]
        public string? Description { get; set; }
        
        /// <summary>
        /// Updated URL to the course media/thumbnail image (optional)
        /// </summary>
        public string? MediaUrl { get; set; }
    }
}

