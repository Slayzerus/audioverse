namespace AudioVerse.API.Models.Requests.Events;

public class AddGamePickRequest
{
    public int? BoardGameId { get; set; }
    public int? VideoGameId { get; set; }
    public string GameName { get; set; } = string.Empty;
}
