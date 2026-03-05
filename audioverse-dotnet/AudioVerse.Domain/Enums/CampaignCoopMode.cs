namespace AudioVerse.Domain.Enums;

/// <summary>Tryb współpracy w kampanii karaoke.</summary>
public enum CampaignCoopMode
{
    /// <summary>Solo — jeden gracz.</summary>
    Solo = 0,

    /// <summary>Wszyscy muszą zaliczyć pułap (liczy się najniższy wynik).</summary>
    AllMustPass = 1,

    /// <summary>Wystarczy jeden (liczy się najwyższy wynik).</summary>
    AnyOnePass = 2
}
