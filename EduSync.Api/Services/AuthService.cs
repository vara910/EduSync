using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using EduSync.Api.Data;
using EduSync.Api.DTOs;
using EduSync.Api.Models;
using EduSync.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;

namespace EduSync.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto loginDto)
        {
            try
            {
                // Find user by email
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
                
                // Check if user exists
                if (user == null)
                {
                    // Log failed login attempt
                    Console.WriteLine($"Login failed: User with email {loginDto.Email} not found");
                    return null;
                }

                // Verify password hash
                if (!VerifyPassword(loginDto.Password, user.PasswordHash))
                {
                    // Log failed login attempt
                    Console.WriteLine($"Login failed: Invalid password for user {loginDto.Email}");
                    return null;
                }

                // Update last login timestamp
                user.LastLogin = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                try
                {
                    // Generate JWT token
                    var token = GenerateJwtToken(user.UserId.ToString(), user.Email, user.Role);

                    // Return login response
                    return new LoginResponseDto
                    {
                        Token = token,
                        Name = user.Name,
                        Email = user.Email,
                        Role = user.Role
                    };
                }
                catch (Exception ex)
                {
                    // Log token generation error
                    Console.WriteLine($"Token generation failed: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex)
            {
                // Log unexpected errors
                Console.WriteLine($"Login error: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> RegisterAsync(RegisterRequestDto registerDto)
        {
            // Check if user with same email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == registerDto.Email);
            if (existingUser != null)
            {
                return false;
            }

            // Create new user
            var user = new User
            {
                Name = registerDto.Name,
                Email = registerDto.Email,
                Role = registerDto.Role,
                PasswordHash = HashPassword(registerDto.Password),
                CreatedAt = DateTime.UtcNow
            };

            // Add user to database
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            return true;
        }

        public string GenerateJwtToken(string userId, string email, string role)
        {
            var jwtKey = _configuration["Security:Jwt:Key"] ?? throw new InvalidOperationException("JWT key is not configured.");
            var jwtIssuer = _configuration["Security:Jwt:Issuer"] ?? throw new InvalidOperationException("JWT issuer is not configured.");
            var jwtAudience = _configuration["Security:Jwt:Audience"] ?? throw new InvalidOperationException("JWT audience is not configured.");
            var jwtExpiryHours = _configuration.GetValue<int>("Security:Jwt:ExpiryHours", 24);

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(ClaimTypes.Role, role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(jwtExpiryHours),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        #region Private Helper Methods

        private string HashPassword(string password)
        {
            // Use BCrypt for secure password hashing
            return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
        }

        private bool VerifyPassword(string password, string passwordHash)
        {
            // Verify password against stored hash
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }

        #endregion
    }
}

