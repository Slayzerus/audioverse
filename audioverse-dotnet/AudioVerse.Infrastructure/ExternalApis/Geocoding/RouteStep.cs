namespace AudioVerse.Infrastructure.ExternalApis;

/// <summary>A single step within a route/directions result.</summary>
public class RouteStep
{
    public string? Instruction { get; set; }
    public double DistanceMeters { get; set; }
    public int DurationSeconds { get; set; }
    public double StartLat { get; set; }
    public double StartLng { get; set; }
    public double EndLat { get; set; }
    public double EndLng { get; set; }
}
