namespace AudioVerse.Application.Queries.Events;

public class PollResultsDto
{
    public int PollId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string PollType { get; set; } = string.Empty;
    public string OptionSource { get; set; } = string.Empty;
    public int TotalResponses { get; set; }
    public int UniqueRespondents { get; set; }
    public decimal TotalCost { get; set; }
    public List<PollOptionResultDto> Options { get; set; } = new();
}
