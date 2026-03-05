using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Auth
{
    /// <summary>
    /// Historical password hash entry to prevent password reuse.
    /// </summary>
    public class PasswordHistory
    {
        public int Id { get; set; }
        public int UserProfileId { get; set; }
        public UserProfile UserProfile { get; set; } = null!;
        public string PasswordHash { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
