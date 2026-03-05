namespace AudioVerse.API.Models.Requests.Events;

public class AddSongPickRequest
{
    public int SongId { get; set; }
    public string SongTitle { get; set; } = string.Empty;
}
