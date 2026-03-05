using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Auth
{
    /// <summary>
    /// Record of a login attempt with IP, timestamp, and success status.
    /// </summary>
    public class LoginAttempt
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public bool Success { get; set; }
        public DateTime AttemptTime { get; set; } = DateTime.UtcNow;
        public string? IpAddress { get; set; }

        public UserProfile? User { get; set; }
    }
}
