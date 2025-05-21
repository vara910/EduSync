using System;
using System.ComponentModel.DataAnnotations;

namespace EduSync.Api.DTOs
{
    public class AssessmentDto
    {
        public Guid AssessmentId { get; set; }
        public Guid CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Questions { get; set; } = "[]";
        public int MaxScore { get; set; }
        public int? TimeLimitMinutes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
    public class CreateAssessmentDto
    {
        [Required]
        public Guid CourseId { get; set; }
        
        [Required, StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Questions { get; set; } = "[]";
        
        [Required, Range(1, 1000)]
        public int MaxScore { get; set; }
        
        public int? TimeLimitMinutes { get; set; }
    }
    
    public class UpdateAssessmentDto
    {
        [StringLength(200)]
        public string? Title { get; set; }
        
        public string? Questions { get; set; }
        
        [Range(1, 1000)]
        public int? MaxScore { get; set; }
        
        public int? TimeLimitMinutes { get; set; }
    }
    
    public class SubmitAssessmentDto
    {
        [Required]
        public Guid AssessmentId { get; set; }
        
        [Required]
        public string Answers { get; set; } = "[]";
        
        public int? TimeSpentSeconds { get; set; }
    }
    
    public class ResultDto
    {
        public Guid ResultId { get; set; }
        public Guid AssessmentId { get; set; }
        public string AssessmentTitle { get; set; } = string.Empty;
        public Guid CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int Score { get; set; }
        public int MaxScore { get; set; }
        public double ScorePercentage { get; set; }
        public DateTime AttemptDate { get; set; }
        public int? TimeTakenSeconds { get; set; }
    }
    
    public class ResultSummaryDto
    {
        public Guid AssessmentId { get; set; }
        public string AssessmentTitle { get; set; } = string.Empty;
        public Guid CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public double AverageScore { get; set; }
        public double AveragePercentage { get; set; }
        public int TotalAttempts { get; set; }
        public int HighestScore { get; set; }
        public int LowestScore { get; set; }
        public int MaxPossibleScore { get; set; }
    }
}
