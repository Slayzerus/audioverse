namespace AudioVerse.Domain.Entities.Events;

/// <summary>Type of league determining schedule generation and scoring.</summary>
public enum LeagueType
{
    /// <summary>Every participant plays every other participant.</summary>
    RoundRobin = 0,

    /// <summary>Single-elimination bracket tournament.</summary>
    SingleElimination = 1,

    /// <summary>Double-elimination bracket tournament.</summary>
    DoubleElimination = 2,

    /// <summary>Swiss system (paired rounds based on standings).</summary>
    Swiss = 3,

    /// <summary>Freeform — events added manually, no auto-scheduling.</summary>
    Freeform = 4,

    /// <summary>Fantasy sports league.</summary>
    Fantasy = 5
}
