namespace AudioVerse.Domain.Enums;

/// <summary>Status rundy kampanii karaoke.</summary>
public enum CampaignRoundStatus
{
    /// <summary>Zablokowana — nie osiągnięto pułapu w poprzedniej rundzie.</summary>
    Locked = 0,

    /// <summary>Odblokowana — gotowa do grania.</summary>
    Unlocked = 1,

    /// <summary>Ukończona — pułap osiągnięty.</summary>
    Completed = 2
}
