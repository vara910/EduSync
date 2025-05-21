using System;
using System.Collections.Generic;

namespace EduSync.Api.DTOs
{
    /// <summary>
    /// Data transfer object for submitting an assessment
    /// </summary>
    public class AssessmentSubmissionDto
    {
        /// <summary>
        /// ID of the assessment being submitted
        /// </summary>
        public Guid AssessmentId { get; set; }
        
        /// <summary>
        /// List of answers for the assessment questions
        /// </summary>
        public List<AssessmentAnswerDto> Answers { get; set; } = new();
        
        /// <summary>
        /// Time taken to complete the assessment
        /// </summary>
        public TimeSpan? TimeTaken { get; set; }
    }

    /// <summary>
    /// Data transfer object for an individual answer
    /// </summary>
    public class AssessmentAnswerDto
    {
        /// <summary>
        /// Question number this answer corresponds to
        /// </summary>
        public int QuestionNumber { get; set; }
        
        /// <summary>
        /// The student's answer
        /// </summary>
        public string Answer { get; set; } = string.Empty;
    }
}

