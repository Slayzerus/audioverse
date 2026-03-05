using System;

namespace AudioVerse.Domain.Entities.Admin
{
    /// <summary>
    /// Zg?oszenie nadu?ycia lub nieodpowiedniej tre?ci (np. nick, opis party).
    /// </summary>
    public class AbuseReport
    {
        public int Id { get; set; }
        public int? ReporterUserId { get; set; }
        public string? ReporterUsername { get; set; }
        public string TargetType { get; set; } = string.Empty; // np. "EventDescription", "Nickname"
        public string TargetValue { get; set; } = string.Empty; // np. opis, nick
        public string Reason { get; set; } = string.Empty; // np. "Wulgaryzm", "Spam"
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool Resolved { get; set; } = false;
        public string? ModeratorComment { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}
