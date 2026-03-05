namespace AudioVerse.Infrastructure.Telemetry;

public interface IRealtimeMetrics
{
    void IncrementPointsReceived(int count);
    void IncrementPacketsReceived();
    void IncrementPacketsDropped(string reason);
    IReadOnlyDictionary<string, int> GetAll();
}
