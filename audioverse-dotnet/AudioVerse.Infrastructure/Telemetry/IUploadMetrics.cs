namespace AudioVerse.Infrastructure.Telemetry;

public interface IUploadMetrics
{
    void IncrementFailure(string reason);
    IReadOnlyDictionary<string, int> GetAll();
}
