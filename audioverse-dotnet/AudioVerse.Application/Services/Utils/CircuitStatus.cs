namespace AudioVerse.Application.Services.Utils;

public record CircuitStatus(int ConsecutiveFailures, DateTime LastFailureUtc, bool IsProbing);
