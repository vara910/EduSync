using System.Threading.Tasks;
using EduSync.Api.DTOs;

namespace EduSync.Api.Services.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto loginDto);
        Task<bool> RegisterAsync(RegisterRequestDto registerDto);
        string GenerateJwtToken(string userId, string email, string role);
    }
}

