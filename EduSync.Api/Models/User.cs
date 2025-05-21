using System;
using System.ComponentModel.DataAnnotations;

namespace EduSync.Api.Models
{
    public class User
    {
        [Key]
        public Guid UserId { get; set; } = Guid.NewGuid();
        
        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required, EmailAddress, StringLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required, StringLength(20)]
        public string Role { get; set; } = "Student"; // Student or Instructor
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLogin { get; set; }
    }
}

