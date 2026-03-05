namespace AudioVerse.Application.Models.Dtos;

public class KaraokeSessionRoundDto
{
    public int Id { get; set; }
    public int? SessionId { get; set; }
    public int? EventId { get; set; }
    public int SongId { get; set; }
    public string? SongTitle { get; set; }
    public string? SongArtist { get; set; }
    public string? SongCoverPath { get; set; }
    public int Number { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PerformedAt { get; set; }
    public bool TeamMode { get; set; }
    public string Mode { get; set; } = string.Empty;
    public int? DurationLimitSeconds { get; set; }
    public int? PlaylistId { get; set; }
    public int PlayerCount { get; set; }

    public static KaraokeSessionRoundDto FromDomain(Domain.Entities.Karaoke.KaraokeSessions.KaraokeSessionRound r) => new()
    {
        Id = r.Id,
        SessionId = r.SessionId,
        EventId = r.EventId,
        SongId = r.SongId,
        SongTitle = r.Song?.Title,
        SongArtist = r.Song?.Artist,
        SongCoverPath = r.Song?.CoverPath,
        Number = r.Number,
        StartTime = r.StartTime,
        CreatedAt = r.CreatedAt,
        PerformedAt = r.PerformedAt,
        TeamMode = r.TeamMode,
        Mode = r.Mode.ToString(),
        DurationLimitSeconds = r.DurationLimitSeconds,
        PlaylistId = r.PlaylistId,
        PlayerCount = r.Players.Count
    };
}
