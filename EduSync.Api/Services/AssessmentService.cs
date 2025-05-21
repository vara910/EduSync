using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using EduSync.Api.Data;
using EduSync.Api.DTOs;
using EduSync.Api.Models;
using EduSync.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EduSync.Api.Services
{
    public class AssessmentService : IAssessmentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AssessmentService> _logger;

        public AssessmentService(
            ApplicationDbContext context,
            ILogger<AssessmentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<AssessmentDto>> GetAssessmentsByCourseAsync(Guid courseId)
        {
            var assessments = await _context.Assessments
                .Where(a => a.CourseId == courseId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return assessments.Select(MapToDto);
        }

        public async Task<AssessmentDto?> GetAssessmentByIdAsync(Guid assessmentId)
        {
            var assessment = await _context.Assessments
                .Include(a => a.Course)
                .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);

            return assessment != null ? MapToDto(assessment) : null;
        }

        public async Task<AssessmentDto> CreateAssessmentAsync(CreateAssessmentDto assessmentDto)
        {
            // Verify course exists
            var course = await _context.Courses.FindAsync(assessmentDto.CourseId);
            if (course == null)
            {
                throw new ArgumentException("Course not found", nameof(assessmentDto.CourseId));
            }

            // Create new assessment
            var assessment = new Assessment
            {
                CourseId = assessmentDto.CourseId,
                Title = assessmentDto.Title,
                Questions = assessmentDto.Questions,
                MaxScore = assessmentDto.MaxScore,
                TimeLimit = assessmentDto.TimeLimitMinutes.HasValue 
                    ? TimeSpan.FromMinutes(assessmentDto.TimeLimitMinutes.Value) 
                    : null,
                CreatedAt = DateTime.UtcNow
            };

            // Add to database
            await _context.Assessments.AddAsync(assessment);
            await _context.SaveChangesAsync();

            assessment.Course = course;
            return MapToDto(assessment);
        }

        public async Task<AssessmentDto?> UpdateAssessmentAsync(Guid assessmentId, UpdateAssessmentDto assessmentDto)
        {
            var assessment = await _context.Assessments
                .Include(a => a.Course)
                .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);

            if (assessment == null)
            {
                return null;
            }

            // Update assessment properties
            if (!string.IsNullOrEmpty(assessmentDto.Title))
            {
                assessment.Title = assessmentDto.Title;
            }

            if (assessmentDto.Questions != null)
            {
                assessment.Questions = assessmentDto.Questions;
            }

            if (assessmentDto.MaxScore.HasValue)
            {
                assessment.MaxScore = assessmentDto.MaxScore.Value;
            }

            if (assessmentDto.TimeLimitMinutes.HasValue)
            {
                assessment.TimeLimit = TimeSpan.FromMinutes(assessmentDto.TimeLimitMinutes.Value);
            }

            assessment.UpdatedAt = DateTime.UtcNow;

            // Save changes
            await _context.SaveChangesAsync();

            return MapToDto(assessment);
        }

        public async Task<bool> DeleteAssessmentAsync(Guid assessmentId)
        {
            var assessment = await _context.Assessments
                .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);

            if (assessment == null)
            {
                return false;
            }

            // Remove assessment from database
            _context.Assessments.Remove(assessment);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<ResultDto> SubmitAssessmentAsync(Guid userId, AssessmentSubmissionDto submitDto)
        {
            var assessment = await _context.Assessments
                .Include(a => a.Course)
                .FirstOrDefaultAsync(a => a.AssessmentId == submitDto.AssessmentId);

            if (assessment == null)
            {
                throw new ArgumentException("Assessment not found", nameof(submitDto.AssessmentId));
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found", nameof(userId));
            }

            // Convert answers to the format expected by CalculateScore
            var answersJson = JsonSerializer.Serialize(submitDto.Answers.Select(a => new Answer
            {
                Id = a.QuestionNumber,
                UserAnswer = a.Answer
            }));

            // Calculate score based on answers
            int score = CalculateScore(assessment.Questions, answersJson);

            // Create result
            var result = new Result
            {
                AssessmentId = submitDto.AssessmentId,
                UserId = userId,
                Score = score,
                AttemptDate = DateTime.UtcNow,
                Answers = answersJson,
                TimeTaken = submitDto.TimeTaken
            };

            // Add to database
            await _context.Results.AddAsync(result);
            await _context.SaveChangesAsync();

            return MapToResultDto(result, assessment, user);
        }

        public async Task<IEnumerable<ResultDto>> GetStudentResultsAsync(Guid userId, Guid? courseId = null)
        {
            var query = _context.Results
                .Include(r => r.Assessment)
                    .ThenInclude(a => a.Course)
                .Include(r => r.User)
                .Where(r => r.UserId == userId);

            // Filter by course if provided
            if (courseId.HasValue)
            {
                query = query.Where(r => r.Assessment != null && r.Assessment.CourseId == courseId.Value);
            }

            var results = await query
                .OrderByDescending(r => r.AttemptDate)
                .ToListAsync();

            return results.Select(r => MapToResultDto(
                r ?? throw new InvalidOperationException("Result is null"), 
                r.Assessment ?? throw new InvalidOperationException("Assessment is null"), 
                r.User ?? throw new InvalidOperationException("User is null")));
        }

        public async Task<IEnumerable<ResultDto>> GetCourseResultsAsync(Guid courseId)
        {
            var results = await _context.Results
                .Include(r => r.Assessment)
                    .ThenInclude(a => a.Course)
                .Include(r => r.User)
                .Where(r => r.Assessment != null && r.Assessment.CourseId == courseId)
                .OrderByDescending(r => r.AttemptDate)
                .ToListAsync();

            return results.Select(r => MapToResultDto(
                r ?? throw new InvalidOperationException("Result is null"),
                r.Assessment ?? throw new InvalidOperationException("Assessment is null"),
                r.User ?? throw new InvalidOperationException("User is null")));
        }

        public async Task<ResultSummaryDto?> GetAssessmentSummaryAsync(Guid assessmentId)
        {
            var assessment = await _context.Assessments
                .Include(a => a.Course)
                .Include(a => a.Results)
                .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);

            if (assessment == null || assessment.Results == null || !assessment.Results.Any())
            {
                return null;
            }

            var results = assessment.Results.ToList();
            
            return new ResultSummaryDto
            {
                AssessmentId = assessment.AssessmentId,
                AssessmentTitle = assessment.Title,
                CourseId = assessment.CourseId,
                CourseName = assessment.Course?.Title ?? "Unknown",
                AverageScore = results.Average(r => r.Score),
                AveragePercentage = results.Average(r => (double)r.Score / assessment.MaxScore * 100),
                TotalAttempts = results.Count,
                HighestScore = results.Max(r => r.Score),
                LowestScore = results.Min(r => r.Score),
                MaxPossibleScore = assessment.MaxScore
            };
        }

        #region Private Helper Methods

        private AssessmentDto MapToDto(Assessment assessment)
        {
            return new AssessmentDto
            {
                AssessmentId = assessment.AssessmentId,
                CourseId = assessment.CourseId,
                CourseName = assessment.Course?.Title ?? "Unknown",
                Title = assessment.Title,
                Questions = assessment.Questions,
                MaxScore = assessment.MaxScore,
                TimeLimitMinutes = assessment.TimeLimit.HasValue 
                    ? (int)assessment.TimeLimit.Value.TotalMinutes 
                    : null,
                CreatedAt = assessment.CreatedAt
            };
        }

        private ResultDto MapToResultDto(Result result, Assessment assessment, User user)
        {
            if (result == null) throw new ArgumentNullException(nameof(result));
            if (assessment == null) throw new ArgumentNullException(nameof(assessment));
            if (user == null) throw new ArgumentNullException(nameof(user));
            
            return new ResultDto
            {
                ResultId = result.ResultId,
                AssessmentId = result.AssessmentId,
                AssessmentTitle = assessment.Title,
                CourseId = assessment.CourseId,
                CourseName = assessment.Course?.Title ?? "Unknown",
                UserId = result.UserId,
                UserName = user?.Name ?? "Unknown",
                Score = result.Score,
                MaxScore = assessment.MaxScore,
                ScorePercentage = (double)result.Score / assessment.MaxScore * 100,
                AttemptDate = result.AttemptDate,
                TimeTakenSeconds = result.TimeTaken.HasValue 
                    ? (int)result.TimeTaken.Value.TotalSeconds 
                    : null
            };
        }

    private int CalculateScore(string questionsJson, string answersJson)
    {
        try
        {
            // Parse questions and answers
            var questions = System.Text.Json.JsonSerializer.Deserialize<List<Question>>(questionsJson) 
                ?? new List<Question>();
            var answers = System.Text.Json.JsonSerializer.Deserialize<List<Answer>>(answersJson) 
                ?? new List<Answer>();

            // Calculate score by matching question IDs and comparing answers
            int totalScore = 0;
            
            foreach (var answer in answers)
            {
                var question = questions.FirstOrDefault(q => q.Id == answer.Id);
                if (question != null && question.CorrectAnswer == answer.UserAnswer)
                {
                    totalScore += question.Points;
                }
            }
            
            return totalScore;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating score");
            return 0;
        }
    }
    
    // Helper classes for JSON deserialization
    private class Question
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public List<string> Options { get; set; } = new List<string>();
        public string CorrectAnswer { get; set; } = string.Empty;
        public int Points { get; set; } = 1;
    }
    
    private class Answer
    {
        public int Id { get; set; }
        public string UserAnswer { get; set; } = string.Empty;
    }

        #endregion
    }
}
