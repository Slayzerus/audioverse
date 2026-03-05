namespace AudioVerse.API.Models.Requests.Events;

public class AddDateProposalRequest
{
    public DateTime ProposedStart { get; set; }
    public DateTime? ProposedEnd { get; set; }
    public int? ProposedByUserId { get; set; }
    public string? Note { get; set; }
}
