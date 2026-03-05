namespace AudioVerse.API.Models.Requests.Karaoke;

public class AddKaraokeSongPickRequest
{
    public int SongId { get; set; }
    public string SongTitle { get; set; } = string.Empty;
}
