namespace AudioVerse.Application.Services.Utils;

/// <summary>Health status of a single AI service endpoint.</summary>
public record AiEndpointHealth(
    string Engine,
    string Group,
    string? Url,
    string Provider,
    bool IsHealthy,
    string Status,
    DateTime? LastCheckedUtc
);
