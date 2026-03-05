using AudioVerse.Domain.Diagrams;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Entities.Contacts;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Domain.Entities.UserProfiles
{
    [DiagramNode("UserProfiles", FillColor = "#fff2cc", StrokeColor = "#d6b656", Icon = "👤", Description = "Profil użytkownika")]
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

        // TOTP 2FA
        public bool TotpEnabled { get; set; }
        public string? TotpSecret { get; set; }

        /// <summary>Events organized by this user.</summary>
        public List<AudioVerse.Domain.Entities.Events.Event> OrganizedEvents { get; set; } = new();

        /// <summary>1:1 contact card for this user (address book self-entry).</summary>
        public int? ContactId { get; set; }
        public Contact? Contact { get; set; }

        /// <summary>MinIO object key for the user's profile photo (bucket: user-photos).</summary>
        public string? PhotoKey { get; set; }
    }
}
