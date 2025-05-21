using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EduSync.Api.Models
{
    public class Result
    {
        [Key]
        public Guid ResultId { get; set; } = Guid.NewGuid();
        
        [ForeignKey("Assessment")]
        public Guid AssessmentId { get; set; }
        
        public Assessment? Assessment { get; set; }
        
        [ForeignKey("User")]
        public Guid UserId { get; set; }
        
        public User? User { get; set; }
        
        public int Score { get; set; }
        
        public DateTime AttemptDate { get; set; } = DateTime.UtcNow;
        
        // Store user's answers as JSON string
        [Column(TypeName = "nvarchar(max)")]
        public string Answers { get; set; } = "[]";
        
        // Time taken to complete the assessment
        public TimeSpan? TimeTaken { get; set; }
    }
}

