namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// Steam player profile summary (ISteamUser/GetPlayerSummaries).
/// </summary>
public class SteamPlayerSummary
{
    public string SteamId { get; set; } = string.Empty;
    public string PersonaName { get; set; } = string.Empty;
    public string? ProfileUrl { get; set; }
    public string? AvatarUrl { get; set; }
    public string? AvatarMediumUrl { get; set; }
    public string? AvatarFullUrl { get; set; }
    public int PersonaState { get; set; }
    public string? RealName { get; set; }
    public string? LocCountryCode { get; set; }
    public long? TimeCreated { get; set; }
    public long? LastLogoff { get; set; }

    public string PersonaStateText => PersonaState switch
    {
        0 => "Offline",
        1 => "Online",
        2 => "Busy",
        3 => "Away",
        4 => "Snooze",
        5 => "Looking to trade",
        6 => "Looking to play",
        _ => "Unknown"
    };
}
