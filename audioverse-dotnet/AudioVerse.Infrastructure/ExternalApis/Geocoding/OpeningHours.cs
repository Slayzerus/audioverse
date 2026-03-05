namespace AudioVerse.Infrastructure.ExternalApis;

/// <summary>Opening hours information for a place.</summary>
public class OpeningHours
{
    public bool IsOpenNow { get; set; }
    public List<string> WeekdayText { get; set; } = [];
}
