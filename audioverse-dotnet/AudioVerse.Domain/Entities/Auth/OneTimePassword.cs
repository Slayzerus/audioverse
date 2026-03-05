using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Auth
{
    /// <summary>
    /// One-time password (OTP) for two-factor authentication or password reset.
    /// </summary>
    public class OneTimePassword
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime? UsedAt { get; set; }

        public UserProfile? User { get; set; }
    }
}
