using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EduSync.Api.Models
{
    /// <summary>
    /// Represents a student's enrollment in a course
    /// </summary>
    public class Enrollment
    {
        /// <summary>
        /// The ID of the student enrolled in the course
        /// </summary>
        public Guid StudentId { get; set; }

        /// <summary>
        /// Navigation property to the student user
        /// </summary>
        public virtual User Student { get; set; } = null!;

        /// <summary>
        /// The ID of the course the student is enrolled in
        /// </summary>
        public Guid CourseId { get; set; }

        /// <summary>
        /// Navigation property to the course
        /// </summary>
        public virtual Course Course { get; set; } = null!;

        /// <summary>
        /// The date when the student enrolled in the course
        /// </summary>
        public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// The current status of the enrollment
        /// </summary>
        [StringLength(50)]
        public string Status { get; set; } = "Active";

        /// <summary>
        /// The date when the student last accessed the course
        /// </summary>
        public DateTime? LastAccessDate { get; set; }

        /// <summary>
        /// The date when the student completed the course (if applicable)
        /// </summary>
        public DateTime? CompletionDate { get; set; }

        /// <summary>
        /// The progress percentage of the course completion (0-100)
        /// </summary>
        public int Progress { get; set; } = 0;

        /// <summary>
        /// Any additional notes about the enrollment
        /// </summary>
        [StringLength(500)]
        public string Notes { get; set; } = string.Empty;
    }
}

