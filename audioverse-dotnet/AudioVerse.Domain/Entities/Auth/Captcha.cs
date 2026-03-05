using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Auth
{
    /// <summary>
    /// CAPTCHA challenge instance with answer and expiration.
    /// </summary>
    public class Captcha
    {
        public int Id { get; set; }
        public string Challenge { get; set; } = string.Empty; // Pytanie lub zadanie
        public string Answer { get; set; } = string.Empty; // Odpowied? (zahaszowana)
        public int CaptchaType { get; set; } // 1-8 (odpowiadaj?ce zadaniom indywidualnym)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; } = false;
        public int? UserId { get; set; }
        public string? IpAddress { get; set; }

        public UserProfile? User { get; set; }
    }
}
