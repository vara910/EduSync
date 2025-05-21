using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using EduSync.Api.DTOs;
using EduSync.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduSync.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
public class AssessmentsController : ControllerBase
{
    private readonly IAssessmentService _assessmentService;
    private readonly ICourseService _courseService;
    private readonly IQuizEventService _quizEventService;
    private readonly ILogger<AssessmentsController> _logger;

    public AssessmentsController(
        IAssessmentService assessmentService,
        ICourseService courseService,
        IQuizEventService quizEventService,
        ILogger<AssessmentsController> logger)
    {
        _assessmentService = assessmentService;
        _courseService = courseService;
        _quizEventService = quizEventService;
        _logger = logger;
    }

        [HttpGet("course/{courseId}")]
        [ProducesResponseType(typeof(IEnumerable<AssessmentDto>), 200)]
        public async Task<ActionResult<IEnumerable<AssessmentDto>>> GetAssessmentsByCourse(Guid courseId)
        {
            var assessments = await _assessmentService.GetAssessmentsByCourseAsync(courseId);
            return Ok(assessments);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(AssessmentDto), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<AssessmentDto>> GetAssessment(Guid id)
        {
            var assessment = await _assessmentService.GetAssessmentByIdAsync(id);
            
            if (assessment == null)
            {
                return NotFound();
            }
            
            return Ok(assessment);
        }

        [HttpPost]
        [Authorize(Roles = "Instructor")]
        [ProducesResponseType(typeof(AssessmentDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(403)]
        public async Task<ActionResult<AssessmentDto>> CreateAssessment([FromBody] CreateAssessmentDto assessmentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Verify current user is instructor of this course
                Guid instructorId = GetCurrentUserId();
                bool isInstructor = await _courseService.IsInstructorOfCourseAsync(assessmentDto.CourseId, instructorId);
                
                if (!isInstructor)
                {
                    return Forbid();
                }
                
                var createdAssessment = await _assessmentService.CreateAssessmentAsync(assessmentDto);
                return CreatedAtAction(nameof(GetAssessment), new { id = createdAssessment.AssessmentId }, createdAssessment);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "An error occurred while creating the assessment." });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor")]
        [ProducesResponseType(typeof(AssessmentDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<AssessmentDto>> UpdateAssessment(Guid id, [FromBody] UpdateAssessmentDto assessmentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Get assessment to verify ownership
                var assessment = await _assessmentService.GetAssessmentByIdAsync(id);
                if (assessment == null)
                {
                    return NotFound();
                }
                
                // Verify current user is instructor of this course
                Guid instructorId = GetCurrentUserId();
                bool isInstructor = await _courseService.IsInstructorOfCourseAsync(assessment.CourseId, instructorId);
                
                if (!isInstructor)
                {
                    return Forbid();
                }
                
                var updatedAssessment = await _assessmentService.UpdateAssessmentAsync(id, assessmentDto);
                return Ok(updatedAssessment);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "An error occurred while updating the assessment." });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor")]
        [ProducesResponseType(204)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> DeleteAssessment(Guid id)
        {
            try
            {
                // Get assessment to verify ownership
                var assessment = await _assessmentService.GetAssessmentByIdAsync(id);
                if (assessment == null)
                {
                    return NotFound();
                }
                
                // Verify current user is instructor of this course
                Guid instructorId = GetCurrentUserId();
                bool isInstructor = await _courseService.IsInstructorOfCourseAsync(assessment.CourseId, instructorId);
                
                if (!isInstructor)
                {
                    return Forbid();
                }
                
                var result = await _assessmentService.DeleteAssessmentAsync(id);
                
                if (!result)
                {
                    return NotFound();
                }
                
                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the assessment." });
            }
        }

        /// <summary>
        /// Start a quiz/assessment attempt
        /// </summary>
        /// <param name="id">The assessment ID</param>
        /// <returns>Assessment details</returns>
        [HttpPost("{id}/start")]
        [ProducesResponseType(typeof(AssessmentDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<AssessmentDto>> StartAssessment(Guid id)
        {
            try
            {
                // Get assessment info
                var assessment = await _assessmentService.GetAssessmentByIdAsync(id);
                if (assessment == null)
                {
                    return NotFound();
                }
                
                // Get user info
                Guid userId = GetCurrentUserId();
                var userClaims = User.Claims.ToList();
                string userName = userClaims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value ?? "Unknown";
                
                // Track quiz start event
                try
                {
                    await _quizEventService.PublishQuizStartEventAsync(new QuizStartEventDto
                    {
                        EventType = "QuizStart",
                        AssessmentId = id,
                        CourseId = assessment.CourseId,
                        StudentId = userId,
                        StudentName = userName,
                        AssessmentTitle = assessment.Title
                    });
                }
                catch (Exception ex)
                {
                    // Log but don't fail if event publishing fails
                    _logger.LogError(ex, "Failed to publish quiz start event");
                }
                
                return Ok(assessment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting assessment {AssessmentId}", id);
                return StatusCode(500, new { message = "An error occurred while starting the assessment." });
            }
        }

        [HttpPost("submit")]
        [ProducesResponseType(typeof(ResultDto), 200)]
        [ProducesResponseType(400)]
        public async Task<ActionResult<ResultDto>> SubmitAssessment([FromBody] AssessmentSubmissionDto submitDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                Guid userId = GetCurrentUserId();
                var result = await _assessmentService.SubmitAssessmentAsync(userId, submitDto);
                
                // Track quiz submission event
                try
                {
                    // Get user info
                    var userClaims = User.Claims.ToList();
                    string userName = userClaims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value ?? "Unknown";
                    
                    // Get assessment for course ID
                    var assessment = await _assessmentService.GetAssessmentByIdAsync(submitDto.AssessmentId);
                    
                    if (assessment != null)
                    {
                        await _quizEventService.PublishQuizSubmitEventAsync(new QuizSubmitEventDto
                        {
                            EventType = "QuizSubmit",
                            AssessmentId = submitDto.AssessmentId,
                            CourseId = assessment.CourseId,
                            StudentId = userId,
                            StudentName = userName,
                            Score = result.Score,
                            MaxScore = assessment.MaxScore,
                            TotalQuestions = submitDto.Answers.Count,
                            CorrectAnswers = result.Score, // Assuming 1 point per correct answer
                            TotalTimeSeconds = (int)(submitDto.TimeTaken?.TotalSeconds ?? 0)
                        });
                    }
                }
                catch (Exception ex)
                {
                    // Log but don't fail if event publishing fails
                    _logger.LogError(ex, "Failed to publish quiz submit event");
                }
                
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting assessment");
                return StatusCode(500, new { message = "An error occurred while submitting the assessment." });
            }
        }

        [HttpGet("results/my")]
        [ProducesResponseType(typeof(IEnumerable<ResultDto>), 200)]
        public async Task<ActionResult<IEnumerable<ResultDto>>> GetMyResults([FromQuery] Guid? courseId = null)
        {
            try
            {
                Guid userId = GetCurrentUserId();
                var results = await _assessmentService.GetStudentResultsAsync(userId, courseId);
                return Ok(results);
            }
            catch (Exception ex)
                {
                _logger.LogError(ex, "Error retrieving results for user");
                return StatusCode(500, new { message = "An error occurred while retrieving your results." });
            }
        }

        [HttpGet("results/course/{courseId}")]
        [Authorize(Roles = "Instructor")]
        [ProducesResponseType(typeof(IEnumerable<ResultDto>), 200)]
        [ProducesResponseType(403)]
        public async Task<ActionResult<IEnumerable<ResultDto>>> GetCourseResults(Guid courseId)
        {
            try
            {
                // Verify current user is instructor of this course
                Guid instructorId = GetCurrentUserId();
                bool isInstructor = await _courseService.IsInstructorOfCourseAsync(courseId, instructorId);
                
                if (!isInstructor)
                {
                    return Forbid();
                }
                
                var results = await _assessmentService.GetCourseResultsAsync(courseId);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving results for course {CourseId}", courseId);
                return StatusCode(500, new { message = "An error occurred while retrieving the course results." });
            }
        }

        [HttpGet("{id}/summary")]
        [Authorize(Roles = "Instructor")]
        [ProducesResponseType(typeof(ResultSummaryDto), 200)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<ResultSummaryDto>> GetAssessmentSummary(Guid id)
        {
            try
            {
                // Get assessment to verify ownership
                var assessment = await _assessmentService.GetAssessmentByIdAsync(id);
                if (assessment == null)
                {
                    return NotFound();
                }
                
                // Verify current user is instructor of this course
                Guid instructorId = GetCurrentUserId();
                bool isInstructor = await _courseService.IsInstructorOfCourseAsync(assessment.CourseId, instructorId);
                
                if (!isInstructor)
                {
                    return Forbid();
                }
                
                var summary = await _assessmentService.GetAssessmentSummaryAsync(id);
                
                if (summary == null)
                {
                    return NotFound(new { message = "No submissions found for this assessment." });
                }
                
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assessment summary for assessment {AssessmentId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the assessment summary." });
            }
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            
            return userId;
        }
    }
}

