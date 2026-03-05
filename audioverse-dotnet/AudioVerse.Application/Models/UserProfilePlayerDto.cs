using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Application.Models
{
    public class UserProfilePlayerDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int ProfileId { get; set; }
        public string PreferredColors { get; set; } = string.Empty;
        public string FillPattern { get; set; } = "Pill";
        public bool IsPrimary { get; set; }
        public string? Email { get; set; }
        public string? Icon { get; set; }
        public string? PhotoUrl { get; set; }
        public KaraokeSettings KaraokeSettings { get; set; } = new();
    }
}
