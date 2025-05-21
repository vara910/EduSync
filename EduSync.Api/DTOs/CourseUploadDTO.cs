using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;

namespace EduSync.Api.DTOs
{
    public class CourseUploadDto
    {
        [Required]
        public Guid CourseId { get; set; }

        [Required]
        public IFormFile File { get; set; } = null!;
    }
}

