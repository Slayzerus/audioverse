namespace AudioVerse.API.Models.Requests.Events;

public class VoteGameRequest
{
    public int UserId { get; set; }
    public int? Priority { get; set; }
}
