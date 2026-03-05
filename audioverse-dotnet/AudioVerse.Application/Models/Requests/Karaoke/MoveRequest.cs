namespace AudioVerse.API.Areas.Karaoke.Controllers;

public class MoveRequest
{
    public int EventId { get; set; }
    public int PlayerId { get; set; }
    public string? FromChannel { get; set; }
    public string? ToChannel { get; set; }
}
