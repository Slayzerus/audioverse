namespace AudioVerse.Application.Models.Audio
{
    public record ScannedAudioFile(string FilePath, string FileName, string? Title, string? Artist, string? Album, string? Genre, int? Year, TimeSpan? Duration, int? SampleRate, int? Channels);
}
