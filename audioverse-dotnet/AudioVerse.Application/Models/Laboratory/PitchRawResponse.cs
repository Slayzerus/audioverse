namespace AudioVerse.Application.Models.Laboratory;

/// <summary>Raw response from the audio_pitch /pitch/pyin endpoint.</summary>
public record PitchRawResponse(
    double? MedianHz,
    PitchTrackPoint[]? Track);
