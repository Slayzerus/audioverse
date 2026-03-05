using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Http;

namespace AudioVerse.Application.Services.User
{
    public class LoginAttemptService : ILoginAttemptService
    {
        private readonly IUserSecurityRepository _securityRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private const int MaxFailedAttempts = 3;
        private const int LockoutDurationMinutes = 15;

        public LoginAttemptService(IUserSecurityRepository securityRepo, IHttpContextAccessor httpContextAccessor)
        {
            _securityRepo = securityRepo;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task RecordLoginAttemptAsync(int userId, string username, bool success)
        {
            var attempt = new LoginAttempt
            {
                UserId = userId,
                Username = username,
                Success = success,
                AttemptTime = DateTime.UtcNow,
                IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString()
            };

            await _securityRepo.RecordLoginAttemptAsync(attempt);
        }

        public async Task<(bool IsBlocked, TimeSpan RemainingTime)> IsUserBlockedAsync(int userId)
        {
            var now = DateTime.UtcNow;
            var lockoutTime = now.AddMinutes(-LockoutDurationMinutes);

            var failedAttempts = await _securityRepo.CountFailedAttemptsAsync(userId, TimeSpan.FromMinutes(LockoutDurationMinutes));

            if (failedAttempts >= MaxFailedAttempts)
            {
                var lastFailedAttempt = await _securityRepo.GetLastFailedAttemptAsync(userId, lockoutTime);

                if (lastFailedAttempt != null)
                {
                    var unlockTime = lastFailedAttempt.AttemptTime.AddMinutes(LockoutDurationMinutes);
                    if (now < unlockTime)
                    {
                        return (true, unlockTime - now);
                    }
                }
            }

            return (false, TimeSpan.Zero);
        }

        public async Task UnblockUserAsync(int userId)
        {
            await _securityRepo.DeleteLoginAttemptsAsync(userId);
        }

        public async Task<List<LoginAttempt>> GetAllLoginAttemptsAsync()
        {
            return (await _securityRepo.GetAllLoginAttemptsAsync()).ToList();
        }

        public async Task<List<LoginAttempt>> GetUserLoginAttemptsAsync(int userId)
        {
            return (await _securityRepo.GetRecentAttemptsAsync(userId, int.MaxValue)).ToList();
        }

        public async Task<List<LoginAttempt>> GetRecentFailedAttemptsAsync(int minutes = 15)
        {
            var since = DateTime.UtcNow.AddMinutes(-minutes);
            return (await _securityRepo.GetFailedAttemptsSinceAsync(since)).ToList();
        }
    }
}
