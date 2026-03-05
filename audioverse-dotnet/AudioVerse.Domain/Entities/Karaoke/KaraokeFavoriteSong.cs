using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Karaoke
{
    public class KaraokeFavoriteSong
    {
        public int Id { get; set; }
        public int PlayerId { get; set; }
        public UserProfilePlayer? Player { get; set; }
        public int SongId { get; set; }
        public KaraokeSongFile? Song { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
