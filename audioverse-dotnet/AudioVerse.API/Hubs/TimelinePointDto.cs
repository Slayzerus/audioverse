namespace AudioVerse.API.Hubs;

/// <summary>Pojedynczy punkt na osi czasu (czas + częstotliwość Hz).</summary>
public record TimelinePointDto(double t, double hz);
