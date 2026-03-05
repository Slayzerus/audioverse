using AudioVerse.Domain.Enums;

namespace AudioVerse.Application.Models.Dtos
{
    /// <summary>
    /// DTO połączenia między graczami.
    /// </summary>
    public class PlayerLinkDto
    {
        public int Id { get; set; }
        public int SourcePlayerId { get; set; }
        public string SourcePlayerName { get; set; } = string.Empty;
        public int SourceProfileId { get; set; }
        public int TargetPlayerId { get; set; }
        public string TargetPlayerName { get; set; } = string.Empty;
        public int TargetProfileId { get; set; }
        public PlayerLinkScope Scope { get; set; }
        public PlayerLinkStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
