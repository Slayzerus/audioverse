using AudioVerse.Application.Models;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Application.Services.User;

public interface IOtpService
{
    Task<string> GenerateOtpAsync(UserProfile user, int expirationMinutes = 30);
    Task<OtpGenerationResult?> GenerateOtpAsync(int userId, int expirationMinutes = 30);
    Task<bool> ValidateOtpAsync(UserProfile user, string otp);
    Task<List<OneTimePassword>> GetAllOtpsAsync();
}
