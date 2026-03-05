using System;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles
{
    public class KaraokeSongFileHistory
    {
        public int Id { get; set; }
        public int KaraokeSongFileId { get; set; }
        public int Version { get; set; }
        public string DataJson { get; set; } = string.Empty; // snapshot JSON
        public int? ChangedByUserId { get; set; }
        public string? Reason { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
