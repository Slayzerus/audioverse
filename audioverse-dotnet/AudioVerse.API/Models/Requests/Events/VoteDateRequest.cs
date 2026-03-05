using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.API.Models.Requests.Events;

public class VoteDateRequest
{
    public int UserId { get; set; }
    public DateVoteStatus Status { get; set; }
    public string? Comment { get; set; }
}
