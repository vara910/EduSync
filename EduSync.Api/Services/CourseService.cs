using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using EduSync.Api.Data;
using EduSync.Api.DTOs;
using EduSync.Api.Models;
using EduSync.Api.Services.Interfaces;

namespace EduSync.Api.Services
{
    /// <summary>
    /// Implementation of the ICourseService for course and enrollment management
    /// </summary>
    public class CourseService : ICourseService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CourseService> _logger;

        /// <summary>
        /// Initializes a new instance of the CourseService
        /// </summary>
        /// <param name="context">The database context</param>
        /// <param name="logger">The logger</param>
        public CourseService(
            ApplicationDbContext context,
            ILogger<CourseService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        #region Course CRUD Operations

        /// <summary>
        /// Gets all available courses
        /// </summary>
        public async Task<IEnumerable<CourseDto>> GetAllCoursesAsync()
        {
            try
            {
                _logger.LogInformation("Retrieving all courses");
                
                var courses = await _context.Courses
                    .Include(c => c.Instructor)
                    .Include(c => c.Enrollments)
                    .Include(c => c.Assessments)
                    .OrderByDescending(c => c.CreatedAt)
                    .ToListAsync();

                var result = courses.Select(course => MapToDto(
                    course,
                    course.Enrollments?.Count(e => e.Status == "Active") ?? 0,
                    course.Assessments?.Count ?? 0
                )).ToList();
                _logger.LogInformation("Retrieved {Count} courses", result.Count);
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all courses");
                return Enumerable.Empty<CourseDto>();
            }
        }

        /// <summary>
        /// Gets a specific course by ID
        /// </summary>
        public async Task<CourseDto?> GetCourseByIdAsync(Guid courseId)
        {
            try
            {
                _logger.LogInformation("Retrieving course with ID: {CourseId}", courseId);
                
                var course = await _context.Courses
                    .Include(c => c.Instructor)
                    .Include(c => c.Enrollments)
                    .Include(c => c.Assessments)
                    .FirstOrDefaultAsync(c => c.CourseId == courseId);

                if (course == null)
                {
                    _logger.LogWarning("Course with ID {CourseId} not found", courseId);
                    return null;
                }

                var enrollmentCount = course.Enrollments?.Count(e => e.Status == "Active") ?? 0;
                var assessmentCount = course.Assessments?.Count ?? 0;
                
                var result = MapToDto(course, enrollmentCount, assessmentCount);
                _logger.LogInformation("Retrieved course: {CourseTitle}", result.Title);
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving course with ID: {CourseId}", courseId);
                return null;
            }
        }

        /// <summary>
        /// Creates a new course
        /// </summary>
        public async Task<CourseDto> CreateCourseAsync(CreateCourseDto courseDto, Guid instructorId)
        {
            try
            {
                _logger.LogInformation("Creating new course by instructor: {InstructorId}", instructorId);
                
                // Verify instructor exists and has appropriate role
                var instructor = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == instructorId && u.Role == "Instructor");

                if (instructor == null)
                {
                    _logger.LogWarning("User {InstructorId} attempted to create a course but is not an instructor", instructorId);
                    throw new UnauthorizedAccessException("Only instructors can create courses");
                }

                // Create new course entity
                var course = new Course
                {
                    CourseId = Guid.NewGuid(),
                    Title = courseDto.Title,
                    Description = courseDto.Description,
                    InstructorId = instructorId,
                    MediaUrl = courseDto.MediaUrl,
                    CreatedAt = DateTime.UtcNow
                };

                // Add to database
                await _context.Courses.AddAsync(course);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created new course with ID: {CourseId}", course.CourseId);
                
                // Associate instructor with the course for DTO mapping
                course.Instructor = instructor;
                return MapToDto(course);
            }
            catch (UnauthorizedAccessException)
            {
                // Re-throw authorization exceptions
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating course by instructor: {InstructorId}", instructorId);
                throw new Exception("Failed to create course", ex);
            }
        }

        /// <summary>
        /// Updates an existing course
        /// </summary>
        public async Task<CourseDto?> UpdateCourseAsync(Guid courseId, UpdateCourseDto courseDto)
        {
            try
            {
                _logger.LogInformation("Updating course with ID: {CourseId}", courseId);
                
                var course = await _context.Courses
                    .Include(c => c.Instructor)
                    .FirstOrDefaultAsync(c => c.CourseId == courseId);

                if (course == null)
                {
                    _logger.LogWarning("Course with ID {CourseId} not found for update", courseId);
                    return null;
                }

                // Update properties if provided
                if (!string.IsNullOrEmpty(courseDto.Title))
                {
                    course.Title = courseDto.Title;
                }

                if (courseDto.Description != null)
                {
                    course.Description = courseDto.Description;
                }

                if (courseDto.MediaUrl != null)
                {
                    course.MediaUrl = courseDto.MediaUrl;
                }

                course.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                _logger.LogInformation("Updated course: {CourseId}", courseId);

                return MapToDto(course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating course with ID: {CourseId}", courseId);
                return null;
            }
        }

        /// <summary>
        /// Deletes a course
        /// </summary>
        public async Task<bool> DeleteCourseAsync(Guid courseId)
        {
            try
            {
                _logger.LogInformation("Deleting course with ID: {CourseId}", courseId);
                
                var course = await _context.Courses
                    .FirstOrDefaultAsync(c => c.CourseId == courseId);

                if (course == null)
                {
                    _logger.LogWarning("Course with ID {CourseId} not found for deletion", courseId);
                    return false;
                }

                // First delete related enrollments
                var enrollments = await _context.Enrollments
                    .Where(e => e.CourseId == courseId)
                    .ToListAsync();
                
                _context.Enrollments.RemoveRange(enrollments);
                
                // Then delete the course
                _context.Courses.Remove(course);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted course: {CourseId}", courseId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting course with ID: {CourseId}", courseId);
                return false;
            }
        }

        /// <summary>
        /// Checks if a user is the instructor of a course
        /// </summary>
        public async Task<bool> IsInstructorOfCourseAsync(Guid courseId, Guid userId)
        {
            try
            {
                _logger.LogInformation("Checking if user {UserId} is instructor of course {CourseId}", userId, courseId);
                
                var isInstructor = await _context.Courses
                    .AnyAsync(c => c.CourseId == courseId && c.InstructorId == userId);
                
                _logger.LogInformation("User {UserId} instructor check for course {CourseId}: {IsInstructor}", 
                    userId, courseId, isInstructor);
                    
                return isInstructor;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user {UserId} is instructor of course {CourseId}", userId, courseId);
                return false;
            }
        }

        #endregion

        #region Enrollment Management

        /// <summary>
        /// Checks if a student is enrolled in a course
        /// </summary>
        public async Task<bool> IsStudentEnrolledAsync(Guid courseId, Guid userId)
        {
            try
            {
                _logger.LogInformation("Checking if user {UserId} is enrolled in course {CourseId}", userId, courseId);
                
                // First check if the course exists
                var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == courseId);
                if (!courseExists)
                {
                    _logger.LogWarning("Course {CourseId} not found when checking enrollment for user {UserId}", courseId, userId);
                    return false;
                }
                
                // Check if the student is enrolled in the course
                var isEnrolled = await _context.Enrollments
                    .AnyAsync(e => e.CourseId == courseId && 
                             e.StudentId == userId && 
                             e.Status == "Active");

                _logger.LogInformation("User {UserId} enrollment check for course {CourseId}: {IsEnrolled}", 
                    userId, courseId, isEnrolled);
                    
                return isEnrolled;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user {UserId} is enrolled in course {CourseId}", userId, courseId);
                return false;
            }
        }

        /// <summary>
        /// Gets all students enrolled in a course
        /// </summary>
        public async Task<IEnumerable<UserDto>> GetEnrolledStudentsAsync(Guid courseId)
        {
            try
            {
                _logger.LogInformation("Getting enrolled students for course {CourseId}", courseId);
                
                // Check if the course exists
                var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == courseId);
                if (!courseExists)
                {
                    _logger.LogWarning("Course {CourseId} not found when retrieving enrolled students", courseId);
                    return Enumerable.Empty<UserDto>();
                }

                // Get all active enrollments for the course
                var enrollments = await _context.Enrollments
                    .Where(e => e.CourseId == courseId && e.Status == "Active")
                    .Include(e => e.Student)
                    .ToListAsync();

                // Map to user DTOs
                var students = enrollments.Select(e => new UserDto
                {
                    UserId = e.Student.UserId,
                    Name = e.Student.Name,
                    Email = e.Student.Email,
                    Role = e.Student.Role,
                    EnrollmentDate = e.EnrollmentDate,
                    Progress = e.Progress,
                    EnrollmentStatus = e.Status,
                    CompletionDate = e.CompletionDate
                }).ToList();

                _logger.LogInformation("Retrieved {Count} enrolled students for course {CourseId}", 
                    students.Count, courseId);
                    
                return students;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving enrolled students for course {CourseId}", courseId);
                return Enumerable.Empty<UserDto>();
            }
        }

        /// <summary>
        /// Gets all courses a student is enrolled in
        /// </summary>
        public async Task<IEnumerable<CourseDto>> GetStudentEnrollmentsAsync(Guid userId)
        {
            try
            {
                _logger.LogInformation("Getting course enrollments for user {UserId}", userId);
                
                // Check if the user exists
                var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);
                if (!userExists)
                {
                    _logger.LogWarning("User {UserId} not found when retrieving enrollments", userId);
                    return Enumerable.Empty<CourseDto>();
                }

                // Get all active enrollments for the student
                var enrollments = await _context.Enrollments
                    .Where(e => e.StudentId == userId && e.Status == "Active")
                    .Include(e => e.Course)
                    .ThenInclude(c => c.Instructor)
                    .ToListAsync();

                // Map to course DTOs with enrollment information
                var courses = new List<CourseDto>();
                foreach (var enrollment in enrollments)
                {
                    var assessmentCount = enrollment.Course.Assessments?.Count ?? 0;
                    if (assessmentCount == 0)
                    {
                        // Fallback to database count if navigational property is not loaded
                        assessmentCount = await _context.Assessments
                            .CountAsync(a => a.CourseId == enrollment.CourseId);
                    }
                    
                    var course = MapToDto(enrollment.Course, 1, assessmentCount);
                    
                    // Add enrollment-specific information
                    course.EnrollmentDate = enrollment.EnrollmentDate;
                    course.Progress = enrollment.Progress;
                    course.LastAccessed = enrollment.LastAccessDate;
                    course.EnrollmentStatus = enrollment.Status;
                    course.CompletionDate = enrollment.CompletionDate;
                    
                    courses.Add(course);
                }

                _logger.LogInformation("Retrieved {Count} course enrollments for user {UserId}", 
                    courses.Count, userId);
                    
                return courses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving course enrollments for user {UserId}", userId);
                return Enumerable.Empty<CourseDto>();
            }
        }

        #endregion

        #region Helper Methods

        /// <summary>
        /// Maps a Course entity to a CourseDto
        /// </summary>
        /// <param name="course">The course entity to map</param>
        /// <param name="enrollmentCount">Number of active enrollments</param>
        /// <param name="assessmentCount">Number of assessments</param>
        private CourseDto MapToDto(Course course, int enrollmentCount = 0, int assessmentCount = 0)
        {
            return new CourseDto
            {
                CourseId = course.CourseId,
                Title = course.Title,
                Description = course.Description,
                InstructorId = course.InstructorId,
                InstructorName = course.Instructor?.Name ?? "Unknown",
                MediaUrl = course.MediaUrl,
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt,
                EnrollmentCount = enrollmentCount,
                AssessmentCount = assessmentCount
            };
        }

        #endregion
    }
}
