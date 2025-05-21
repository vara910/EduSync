using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using EduSync.Api.DTOs;
using EduSync.Api.Services.Interfaces;

namespace EduSync.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponseDto), 200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid input", errors = ModelState });
            }

            try
            {
                var response = await _authService.LoginAsync(loginDto);
                
                if (response == null)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                // This would be configuration issues
                Console.WriteLine($"Authentication configuration error: {ex.Message}");
                return StatusCode(500, new { message = "Authentication service configuration error" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        [HttpPost("register")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _authService.RegisterAsync(registerDto);
            
            if (!success)
            {
                return BadRequest(new { message = "User with this email already exists" });
            }

            return Ok(new { message = "Registration successful" });
        }

        [HttpGet("test-auth")]
        [Authorize]
        public IActionResult TestAuth()
        {
            return Ok(new { message = "Authentication successful", user = User.Identity?.Name ?? "User" });
        }

        [HttpGet("admin-only")]
        [Authorize(Roles = "Instructor")]
        public IActionResult AdminOnly()
        {
            return Ok(new { message = "You are an instructor" });
        }
    }
}

