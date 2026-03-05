namespace AudioVerse.Domain.Entities.Audio;

/// <summary>
/// Dance style definition (e.g., Salsa, Waltz) with BPM range and time signature.
/// </summary>
public class DanceStyle
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NamePl { get; set; }
    public string Category { get; set; } = string.Empty;
    public int BpmMin { get; set; }
    public int BpmMax { get; set; }
    public string TimeSignature { get; set; } = "4/4";
    public decimal? EnergyMin { get; set; }
    public decimal? EnergyMax { get; set; }
    public decimal? ValenceMin { get; set; }
    public decimal? ValenceMax { get; set; }
    public string? RhythmPattern { get; set; }
    public string? Description { get; set; }
}
