using System;

namespace AudioVerse.Application.Models.Dtos
{
    public class KaraokeRoundPlayerDto
    {
        public int Id { get; set; }
        public int RoundId { get; set; }
        public int PlayerId { get; set; }
        public int Slot { get; set; }
        public DateTime? JoinedAt { get; set; }
        public string? MicDeviceId { get; set; }
        public AudioVerse.Application.Models.UserProfilePlayerDto? Player { get; set; }
    }
}
