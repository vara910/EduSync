using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduSync.Api.DTOs;
using EduSync.Api.Models;

namespace EduSync.Api.Services.Interfaces
{
    public interface ICourseService
    {
        /// <summary>
        /// Gets all available courses
        /// </summary>
        Task<IEnumerable<CourseDto>> GetAllCoursesAsync();
        
        /// <summary>
        /// Gets a specific course by ID
        /// </summary>
        Task<CourseDto?> GetCourseByIdAsync(Guid courseId);
        
        /// <summary>
        /// Creates a new course
        /// </summary>
        Task<CourseDto> CreateCourseAsync(CreateCourseDto courseDto, Guid instructorId);
        
        /// <summary>
        /// Updates an existing course
        /// </summary>
        Task<CourseDto?> UpdateCourseAsync(Guid courseId, UpdateCourseDto courseDto);
        
        /// <summary>
        /// Deletes a course
        /// </summary>
        Task<bool> DeleteCourseAsync(Guid courseId);
        
        /// <summary>
        /// Checks if a user is the instructor of a course
        /// </summary>
        Task<bool> IsInstructorOfCourseAsync(Guid courseId, Guid userId);
        
        /// <summary>
        /// Checks if a student is enrolled in a course
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <param name="userId">The ID of the student</param>
        /// <returns>True if the student is enrolled, false otherwise</returns>
        Task<bool> IsStudentEnrolledAsync(Guid courseId, Guid userId);
        
        /// <summary>
        /// Gets all students enrolled in a course
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <returns>Collection of enrolled student information</returns>
        Task<IEnumerable<UserDto>> GetEnrolledStudentsAsync(Guid courseId);
        
        /// <summary>
        /// Gets all courses a student is enrolled in
        /// </summary>
        /// <param name="userId">The ID of the student</param>
        /// <returns>Collection of courses the student is enrolled in</returns>
        Task<IEnumerable<CourseDto>> GetStudentEnrollmentsAsync(Guid userId);
    }
}
