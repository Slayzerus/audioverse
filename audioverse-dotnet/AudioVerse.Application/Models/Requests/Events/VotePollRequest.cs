namespace AudioVerse.API.Areas.Events.Controllers;

public class VotePollRequest
{
    public List<int> OptionIds { get; set; } = new();
    public string? Email { get; set; }
    public Dictionary<int, int>? Quantities { get; set; }
}
