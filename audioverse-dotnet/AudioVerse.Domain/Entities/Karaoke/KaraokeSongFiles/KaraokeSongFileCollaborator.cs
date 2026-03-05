namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles
{
    public class KaraokeSongFileCollaborator
    {
        public int SongId { get; set; }
        public KaraokeSongFile Song { get; set; } = null!;
        public int UserId { get; set; }
        public Enums.CollaborationPermission Permission { get; set; } = AudioVerse.Domain.Enums.CollaborationPermission.Read;
    }
}
