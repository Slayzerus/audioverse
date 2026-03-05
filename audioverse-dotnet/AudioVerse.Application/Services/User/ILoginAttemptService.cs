using AudioVerse.Domain.Entities.Auth;

namespace AudioVerse.Application.Services.User;

public interface ILoginAttemptService
{
    Task RecordLoginAttemptAsync(int userId, string username, bool success);
    Task<(bool IsBlocked, TimeSpan RemainingTime)> IsUserBlockedAsync(int userId);
    Task UnblockUserAsync(int userId);
    Task<List<LoginAttempt>> GetAllLoginAttemptsAsync();
    Task<List<LoginAttempt>> GetUserLoginAttemptsAsync(int userId);
    Task<List<LoginAttempt>> GetRecentFailedAttemptsAsync(int minutes = 15);
}
