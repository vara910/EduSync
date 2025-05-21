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
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CoursesController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetAllCourses()
        {
            var courses = await _courseService.GetAllCoursesAsync();
            return Ok(courses);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDto>> GetCourse(Guid id)
        {
            var course = await _courseService.GetCourseByIdAsync(id);

            if (course == null)
            {
                return NotFound();
            }

            return Ok(course);
        }

        [HttpPost]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult<CourseDto>> CreateCourse([FromBody] CreateCourseDto courseDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                Guid instructorId = GetCurrentUserId();

                var createdCourse = await _courseService.CreateCourseAsync(courseDto, instructorId);
                return CreatedAtAction(nameof(GetCourse), new { id = createdCourse.CourseId }, createdCourse);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "An error occurred while creating the course." });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult<CourseDto>> UpdateCourse(Guid id, [FromBody] UpdateCourseDto courseDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Guid instructorId = GetCurrentUserId();
            bool isInstructor = await _courseService.IsInstructorOfCourseAsync(id, instructorId);

            if (!isInstructor)
            {
                return Forbid();
            }

            var updatedCourse = await _courseService.UpdateCourseAsync(id, courseDto);

            if (updatedCourse == null)
            {
                return NotFound();
            }

            return Ok(updatedCourse);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> DeleteCourse(Guid id)
        {
            Guid instructorId = GetCurrentUserId();
            bool isInstructor = await _courseService.IsInstructorOfCourseAsync(id, instructorId);

            if (!isInstructor)
            {
                return Forbid();
            }

            bool result = await _courseService.DeleteCourseAsync(id);

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
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
