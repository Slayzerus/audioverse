using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Application.Services.User
{
    public class PasswordService : IPasswordService
    {
        private readonly IUserProfileRepository _repository;
        private readonly IPasswordHasher<UserProfile> _passwordHasher;
        private readonly ISystemConfigRepository _configRepo;
        private PasswordRequirements _passwordRequirements;

        public PasswordService(
            IUserProfileRepository repository,
            IPasswordHasher<UserProfile> passwordHasher,
            ISystemConfigRepository configRepo)
        {
            _repository = repository;
            _passwordHasher = passwordHasher;
            _configRepo = configRepo;
            _passwordRequirements = new PasswordRequirements();
        }

        public void UpdatePasswordRequirements(PasswordRequirements requirements)
        {
            _passwordRequirements = requirements;            
        }

        public async Task<(bool Success, List<string> Errors)> ValidatePasswordAsync(string password)
        {
            return _passwordRequirements.ValidatePassword(password);
        }

        public async Task<bool> IsPasswordInHistoryAsync(int userId, string newPassword)
        {
            var passwordHistories = await _repository.GetPasswordHistoryAsync(userId, 10);
            var tempUser = new UserProfile();

            foreach (var history in passwordHistories)
            {
                var result = _passwordHasher.VerifyHashedPassword(tempUser, history.PasswordHash, newPassword);
                if (result == PasswordVerificationResult.Success ||
                    result == PasswordVerificationResult.SuccessRehashNeeded)
                {
                    return true;
                }
            }

            return false;
        }

        public async Task AddPasswordToHistoryAsync(int userId, string passwordHash)
        {
            var passwordHistory = new PasswordHistory
            {
                UserProfileId = userId,
                PasswordHash = passwordHash,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.AddPasswordHistoryAsync(passwordHistory);
        }

        public async Task<bool> IsPasswordExpiredAsync(UserProfile user)
        {
            if (user.PasswordExpiryDate.HasValue && user.PasswordExpiryDate.Value < DateTime.UtcNow)
            {
                return true;
            }

            return false;
        }

        public void UpdatePasswordExpiry(UserProfile user)
        {
            if (user.PasswordValidityDays.HasValue)
            {
                user.PasswordExpiryDate = DateTime.UtcNow.AddDays(user.PasswordValidityDays.Value);
            }
            else
            {
                user.PasswordExpiryDate = null;
            }

            user.LastPasswordChangeDate = DateTime.UtcNow;
        }

        public async Task<List<PasswordRequirements>> GetActivePasswordRequirementsAsync()
        {
            var req = await _configRepo.GetPasswordRequirementsAsync();
            return req != null ? [req] : [];
        }

        public async Task<PasswordRequirements?> GetCurrentPasswordRequirementAsync()
        {
            return await _configRepo.GetPasswordRequirementsAsync();
        }
    }
}
