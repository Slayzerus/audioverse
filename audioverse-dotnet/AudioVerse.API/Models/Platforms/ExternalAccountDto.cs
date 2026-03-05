using System;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.API.Models.Platforms
{
    /// <summary>
    /// DTO representing a user's linked external account
    /// </summary>
    public sealed class ExternalAccountDto
    {
        public int Id { get; set; }
        public ExternalPlatform Platform { get; set; }
        public string ExternalUserId { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? Email { get; set; }
        public string? AvatarUrl { get; set; }
        public DateTime LinkedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public bool IsActive { get; set; }
        public DateTime? TokenExpiresAt { get; set; }
        public string? Scopes { get; set; }
    }
}
