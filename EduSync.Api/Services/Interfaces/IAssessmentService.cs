using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduSync.Api.DTOs;

namespace EduSync.Api.Services.Interfaces
{
    public interface IAssessmentService
    {
        /// <summary>
        /// Gets all assessments for a specific course
        /// </summary>
        Task<IEnumerable<AssessmentDto>> GetAssessmentsByCourseAsync(Guid courseId);
        
        /// <summary>
        /// Gets a specific assessment by ID
        /// </summary>
        Task<AssessmentDto?> GetAssessmentByIdAsync(Guid assessmentId);
        
        /// <summary>
        /// Creates a new assessment for a course
        /// </summary>
        Task<AssessmentDto> CreateAssessmentAsync(CreateAssessmentDto assessmentDto);
        
        /// <summary>
        /// Updates an existing assessment
        /// </summary>
        Task<AssessmentDto?> UpdateAssessmentAsync(Guid assessmentId, UpdateAssessmentDto assessmentDto);
        
        /// <summary>
        /// Deletes an assessment
        /// </summary>
        Task<bool> DeleteAssessmentAsync(Guid assessmentId);
        
        /// <summary>
        /// Submits an assessment attempt
        /// </summary>
Task<ResultDto> SubmitAssessmentAsync(Guid userId, AssessmentSubmissionDto submitDto);
        
        /// <summary>
        /// Gets assessment results for a student
        /// </summary>
        Task<IEnumerable<ResultDto>> GetStudentResultsAsync(Guid userId, Guid? courseId = null);

        /// <summary>
        /// Gets assessment results for an instructor's course
        /// </summary>
        Task<IEnumerable<ResultDto>> GetCourseResultsAsync(Guid courseId);

        /// <summary>
        /// Gets summary statistics for an assessment
        /// </summary>
        Task<ResultSummaryDto?> GetAssessmentSummaryAsync(Guid assessmentId);
    }
}

