using AudioVerse.Application.Models.Utils;

namespace AudioVerse.Application.Services.Utils;

public interface IDanceClassificationService
{
    List<DanceClassificationResult> ClassifyByParams(decimal bpm, int timeSignature = 4, decimal? energy = null, decimal? valence = null);
    Task<List<DanceClassificationResult>> ClassifySongAsync(int songId, CancellationToken ct = default);
}
