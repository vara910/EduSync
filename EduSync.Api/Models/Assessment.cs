using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace EduSync.Api.Models
{
    public class Assessment
    {
        [Key]
        public Guid AssessmentId { get; set; } = Guid.NewGuid();
        
        [ForeignKey("Course")]
        public Guid CourseId { get; set; }
        
        public Course? Course { get; set; }
        
        [Required, StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        // Store questions as JSON string
        [Column(TypeName = "nvarchar(max)")]
        public string Questions { get; set; } = "[]";
        
        public int MaxScore { get; set; }
        
        public TimeSpan? TimeLimit { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<Result>? Results { get; set; }
    }
}

