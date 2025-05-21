using System;
using System.Text.Json.Serialization;

namespace EduSync.Api.DTOs
{
    /// <summary>
    /// Base class for all quiz event DTOs
    /// </summary>
    public abstract class QuizEventDto
    {
        /// <summary>
        /// Unique identifier for the event
        /// </summary>
        public Guid EventId { get; set; } = Guid.NewGuid();
        
        /// <summary>
        /// The type of quiz event
        /// </summary>
        public required string EventType { get; set; }
        
        /// <summary>
        /// The ID of the assessment this event relates to
        /// </summary>
        public Guid AssessmentId { get; set; }
        
        /// <summary>
        /// The ID of the course this assessment belongs to
        /// </summary>
        public Guid CourseId { get; set; }
        
        /// <summary>
        /// The ID of the student
        /// </summary>
        public Guid StudentId { get; set; }
        
        /// <summary>
        /// The name of the student
        /// </summary>
        public required string StudentName { get; set; }
        
        /// <summary>
        /// When this event occurred
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
    
    /// <summary>
    /// Event sent when a student starts a quiz
    /// </summary>
    public class QuizStartEventDto : QuizEventDto
    {
        public QuizStartEventDto()
        {
            EventType = "QuizStart";
        }
        
        /// <summary>
        /// The title of the assessment
        /// </summary>
        public required string AssessmentTitle { get; set; }
    }
    
    /// <summary>
    /// Event sent when a student answers a question
    /// </summary>
    public class QuizAnswerEventDto : QuizEventDto
    {
        public QuizAnswerEventDto()
        {
            EventType = "QuizAnswer";
        }
        
        /// <summary>
        /// The index of the question that was answered
        /// </summary>
        public int QuestionIndex { get; set; }
        
        /// <summary>
        /// Whether the answer was correct
        /// </summary>
        public bool IsCorrect { get; set; }
        
        /// <summary>
        /// The time taken to answer the question in seconds
        /// </summary>
        public int TimeTakenSeconds { get; set; }
    }
    
    /// <summary>
    /// Event sent when a student submits a quiz
    /// </summary>
    public class QuizSubmitEventDto : QuizEventDto
    {
        public QuizSubmitEventDto()
        {
            EventType = "QuizSubmit";
        }
        
        /// <summary>
        /// The score achieved by the student
        /// </summary>
        public int Score { get; set; }
        
        /// <summary>
        /// The maximum possible score
        /// </summary>
        public int MaxScore { get; set; }
        
        /// <summary>
        /// The percentage score
        /// </summary>
        public double ScorePercentage => MaxScore > 0 ? (double)Score / MaxScore * 100 : 0;
        
        /// <summary>
        /// The total time taken to complete the quiz in seconds
        /// </summary>
        public int TotalTimeSeconds { get; set; }
        
        /// <summary>
        /// Number of correct answers
        /// </summary>
        public int CorrectAnswers { get; set; }
        
        /// <summary>
        /// Total number of questions
        /// </summary>
        public int TotalQuestions { get; set; }
    }
}

