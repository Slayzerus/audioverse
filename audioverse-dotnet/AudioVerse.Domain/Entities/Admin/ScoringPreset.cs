using System;

namespace AudioVerse.Domain.Entities.Admin
{
    /// <summary>
    /// Karaoke scoring configuration preset with thresholds per accuracy level.
    /// </summary>
    public class ScoringPreset
    {
        public int Id { get; set; }
        // Full JSON payload with easy/normal/hard presets
        public string DataJson { get; set; } = string.Empty;
        public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;
        public int? ModifiedByUserId { get; set; }
        public string? ModifiedByUsername { get; set; }
    }
}
