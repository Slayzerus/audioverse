using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Application.Services.User
{
    public interface IPasswordService
    {
        Task<(bool Success, List<string> Errors)> ValidatePasswordAsync(string password);
        Task<bool> IsPasswordInHistoryAsync(int userId, string newPassword);
        Task AddPasswordToHistoryAsync(int userId, string passwordHash);
        Task<bool> IsPasswordExpiredAsync(UserProfile user);
        void UpdatePasswordExpiry(UserProfile user);
        void UpdatePasswordRequirements(PasswordRequirements requirements);
        Task<List<PasswordRequirements>> GetActivePasswordRequirementsAsync();
        Task<PasswordRequirements?> GetCurrentPasswordRequirementAsync();
    }
}
