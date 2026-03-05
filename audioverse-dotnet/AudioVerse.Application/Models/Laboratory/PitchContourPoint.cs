namespace AudioVerse.Application.Models.Laboratory;

/// <summary>Single point on a pitch (F0) contour: time position and detected frequency.</summary>
public record PitchContourPoint(double TimeSec, double FrequencyHz);
