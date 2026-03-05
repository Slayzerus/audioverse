namespace AudioVerse.Domain.Enums;

/// <summary>
/// Predefined rating criteria labels per entity type.
/// Each entity type defines what Criterion1/2/3 mean.
/// </summary>
public enum RatingCriterion
{
    /// <summary>Overall / general impression.</summary>
    Overall = 0,

    // ── Games ──
    /// <summary>How fun the game is.</summary>
    Fun = 1,
    /// <summary>How replayable the game is.</summary>
    Replayability = 2,
    /// <summary>Visual and audio quality.</summary>
    Presentation = 3,

    // ── Music / Karaoke ──
    /// <summary>Musical arrangement quality.</summary>
    Arrangement = 10,
    /// <summary>How singable / fun to perform.</summary>
    Singability = 11,
    /// <summary>Lyrics quality / depth.</summary>
    Lyrics = 12,

    // ── Radio ──
    /// <summary>Music selection / playlist quality.</summary>
    MusicSelection = 20,
    /// <summary>Audio / stream quality.</summary>
    StreamQuality = 21,
    /// <summary>Host / DJ performance.</summary>
    HostQuality = 22,

    // ── Movies / Series ──
    /// <summary>Story / plot quality.</summary>
    Story = 30,
    /// <summary>Acting performance.</summary>
    Acting = 31,
    /// <summary>Visuals / cinematography.</summary>
    Visuals = 32,

    // ── Events ──
    /// <summary>Organization quality.</summary>
    Organization = 40,
    /// <summary>Atmosphere / vibe.</summary>
    Atmosphere = 41,
    /// <summary>Value for money.</summary>
    ValueForMoney = 42,

    // ── Vendors ──
    /// <summary>Service quality.</summary>
    ServiceQuality = 50,
    /// <summary>Communication responsiveness.</summary>
    Communication = 51,
    /// <summary>Price fairness.</summary>
    PriceFairness = 52
}
