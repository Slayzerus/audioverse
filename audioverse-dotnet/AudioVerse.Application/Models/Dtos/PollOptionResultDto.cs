namespace AudioVerse.Application.Queries.Events;

public class PollOptionResultDto
{
    public int OptionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int? SourceEntityId { get; set; }
    public string? SourceEntityType { get; set; }
    public decimal? UnitCost { get; set; }
    public string? ImageUrl { get; set; }
    public int Count { get; set; }
    public int TotalQuantity { get; set; }
    public double Percentage { get; set; }
    public decimal LineCost { get; set; }
}
