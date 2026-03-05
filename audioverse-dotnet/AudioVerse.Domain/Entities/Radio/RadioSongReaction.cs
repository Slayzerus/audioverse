namespace AudioVerse.Domain.Entities.Radio;

/// <summary>
/// Reakcja użytkownika na aktualnie graną piosenkę (like, emoji).
/// </summary>
public class RadioSongReaction
{
    public int Id { get; set; }
    public int RadioStationId { get; set; }

    /// <summary>ID tracka / playlistItem na który reaguje.</summary>
    public int? TrackId { get; set; }

    /// <summary>Zewnętrzny identyfikator tracka (jeśli YouTube/Spotify).</summary>
    public string? ExternalTrackId { get; set; }

    public int? UserId { get; set; }

    /// <summary>Typ reakcji: like, love, fire, sad, laugh, clap, dislike.</summary>
    public string ReactionType { get; set; } = "like";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
