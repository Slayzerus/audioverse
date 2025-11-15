using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Domain.Entities
{
    public class UserProfile : IdentityUser<int>
    {        
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime RefreshTokenExpiryTime { get; set; }
        public ICollection<UserProfilePlayer> Players { get; set; } = new List<UserProfilePlayer>();

        public string FullName { get; set; } = string.Empty;
        public bool IsBlocked { get; set; } = false;
        public bool RequirePasswordChange { get; set; } = false;
        public DateTime? PasswordExpiryDate { get; set; }
        public int? PasswordValidityDays { get; set; }
        public ICollection<PasswordHistory> PasswordHistories { get; set; } = new List<PasswordHistory>();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastPasswordChangeDate { get; set; }
    }
}
