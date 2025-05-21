using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using EduSync.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EduSync.Api.Controllers
{
    [Route("api/courses/{courseId}/[controller]")]
    [ApiController]
    [Authorize]
    public class MaterialsController : ControllerBase
    {
        private readonly IBlobStorageService _blobStorageService;
        private readonly ICourseService _courseService;
        private readonly ILogger<MaterialsController> _logger;

        public MaterialsController(
            IBlobStorageService blobStorageService,
            ICourseService courseService,
            ILogger<MaterialsController> logger)
        {
            _blobStorageService = blobStorageService;
            _courseService = courseService;
            _logger = logger;
        }

        /// <summary>
        /// Uploads a file as course material
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <param name="file">The file to upload</param>
        /// <returns>URL of the uploaded file</returns>
        [HttpPost("upload")]
        [Authorize(Roles = "Instructor")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [RequestSizeLimit(100 * 1024 * 1024)] // 100 MB limit
        public async Task<IActionResult> UploadMaterial(Guid courseId, IFormFile file)
        {
            // Check that the course exists and the current user is the instructor
            Guid userId = GetCurrentUserId();
            bool isInstructor = await _courseService.IsInstructorOfCourseAsync(courseId, userId);

            if (!isInstructor)
            {
                return Forbid();
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            try
            {
                // Upload the file
                string fileUrl = await _blobStorageService.UploadFileAsync(courseId, file);

                // Return the URL
                return Created(fileUrl, new { url = fileUrl, name = file.FileName, size = file.Length });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file for course {CourseId}", courseId);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error uploading file");
            }
        }

        /// <summary>
        /// Lists all materials for a course
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <returns>List of course materials</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMaterials(Guid courseId)
        {
            // Verify the course exists
            var course = await _courseService.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return NotFound("Course not found");
            }

            // Verify user is enrolled in the course or is the instructor
            Guid userId = GetCurrentUserId();
            bool isInstructor = await _courseService.IsInstructorOfCourseAsync(courseId, userId);
            bool isEnrolled = await _courseService.IsStudentEnrolledAsync(courseId, userId);

            if (!isInstructor && !isEnrolled)
            {
                return Forbid();
            }

            try
            {
                // Get the list of files
                var files = await _blobStorageService.ListFilesAsync(courseId);
                return Ok(files);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing files for course {CourseId}", courseId);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error listing files");
            }
        }

        /// <summary>
        /// Downloads a course material file
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <param name="fileName">The name of the file to download</param>
        /// <returns>The file content</returns>
        [HttpGet("download/{fileName}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DownloadMaterial(Guid courseId, string fileName)
        {
            // Verify the course exists
            var course = await _courseService.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return NotFound("Course not found");
            }

            // Verify user is enrolled in the course or is the instructor
            Guid userId = GetCurrentUserId();
            bool isInstructor = await _courseService.IsInstructorOfCourseAsync(courseId, userId);
            bool isEnrolled = await _courseService.IsStudentEnrolledAsync(courseId, userId);

            if (!isInstructor && !isEnrolled)
            {
                return Forbid();
            }

            try
            {
                // Get the file
                var (fileStream, contentType, downloadFileName) = await _blobStorageService.DownloadFileAsync(courseId, fileName);
                return File(fileStream, contentType, downloadFileName);
            }
            catch (FileNotFoundException)
            {
                return NotFound("File not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file {FileName} for course {CourseId}", fileName, courseId);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error downloading file");
            }
        }

        /// <summary>
        /// Generates a temporary access URL for a course material
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <param name="fileName">The name of the file</param>
        /// <returns>Temporary access URL</returns>
        [HttpGet("access/{fileName}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAccessUrl(Guid courseId, string fileName)
        {
            // Verify the course exists
            var course = await _courseService.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return NotFound("Course not found");
            }

            // Verify user is enrolled in the course or is the instructor
            Guid userId = GetCurrentUserId();
            bool isInstructor = await _courseService.IsInstructorOfCourseAsync(courseId, userId);
            bool isEnrolled = await _courseService.IsStudentEnrolledAsync(courseId, userId);

            if (!isInstructor && !isEnrolled)
            {
                return Forbid();
            }

            try
            {
                // Generate a SAS URL that's valid for 1 hour
                string sasUrl = await _blobStorageService.GenerateSasUrlAsync(courseId, fileName, TimeSpan.FromHours(1));
                return Ok(new { url = sasUrl });
            }
            catch (FileNotFoundException)
            {
                return NotFound("File not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating access URL for file {FileName} in course {CourseId}", fileName, courseId);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error generating access URL");
            }
        }

        /// <summary>
        /// Deletes a course material file
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <param name="fileName">The name of the file to delete</param>
        /// <returns>Success indicator</returns>
        [HttpDelete("{fileName}")]
        [Authorize(Roles = "Instructor")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteMaterial(Guid courseId, string fileName)
        {
            // Verify the user is the instructor of this course
            Guid userId = GetCurrentUserId();
            bool isInstructor = await _courseService.IsInstructorOfCourseAsync(courseId, userId);

            if (!isInstructor)
            {
                return Forbid();
            }

            try
            {
                // Delete the file
                bool deleted = await _blobStorageService.DeleteFileAsync(courseId, fileName);
                
                if (!deleted)
                {
                    return NotFound("File not found");
                }
                
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file {FileName} from course {CourseId}", fileName, courseId);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error deleting file");
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

