using System.ComponentModel.DataAnnotations;

namespace EduSync.Api.DTOs
{
    public class LoginRequestDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }
    
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
    
    public class RegisterRequestDto
    {
        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;
        
        [Required, Compare("Password")]
        public string ConfirmPassword { get; set; } = string.Empty;
        
        [Required, StringLength(20)]
        public string Role { get; set; } = "Student";
        
    }
}

