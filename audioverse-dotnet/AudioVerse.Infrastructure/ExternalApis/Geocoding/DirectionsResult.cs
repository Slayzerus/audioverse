namespace AudioVerse.Infrastructure.ExternalApis;

/// <summary>Route/directions result.</summary>
public class DirectionsResult
{
    public double DistanceMeters { get; set; }
    public int DurationSeconds { get; set; }
    public string? DistanceText { get; set; }
    public string? DurationText { get; set; }
    public string? EncodedPolyline { get; set; }
    public List<RouteStep> Steps { get; set; } = [];
}
