using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace EduSync.Api.Models
{
    public class Course
    {
        [Key]
        public Guid CourseId { get; set; } = Guid.NewGuid();
        
        [Required, StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        public Guid InstructorId { get; set; }
        
        public virtual User Instructor { get; set; } = null!;
        
        public string? MediaUrl { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
        public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
