using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Admin
{
    /// <summary>
    /// System audit log entry tracking administrative actions and changes.
    /// </summary>
    public class AuditLog
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // "Login", "Logout", "CreateUser", "DeleteUser", "ChangePassword", etc.
        public string Description { get; set; } = string.Empty;
        // Optional JSON payload with details about the change (old/new values etc.)
        public string? DetailsJson { get; set; }
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }

        public UserProfile? User { get; set; }
    }
}
