using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Models.Requests.Karaoke
{
    public class UpdateKaraokePlayerStatusRequest
    {
        public KaraokePlayerStatus Status { get; set; }
    }
}
