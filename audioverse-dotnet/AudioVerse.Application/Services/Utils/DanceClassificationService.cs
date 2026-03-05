using AudioVerse.Application.Models.Utils;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Services.Utils;

public class DanceClassificationService : IDanceClassificationService
{
    private readonly IKaraokeRepository _karaokeRepo;

    public DanceClassificationService(IKaraokeRepository karaokeRepo)
    {
        _karaokeRepo = karaokeRepo;
    }

    public async Task<List<DanceClassificationResult>> ClassifySongAsync(int songId, CancellationToken ct = default)
    {
        var song = await _karaokeRepo.GetSongByIdAsync(songId);
        if (song == null || song.Bpm <= 0)
            return new List<DanceClassificationResult>();

        return ClassifyByParams(song.Bpm);
    }

    public List<DanceClassificationResult> ClassifyByParams(
        decimal bpm, int timeSignature = 4, decimal? energy = null, decimal? valence = null)
    {
        var results = new List<DanceClassificationResult>();

        foreach (var rule in DanceRules)
        {
            if (bpm < rule.BpmMin || bpm > rule.BpmMax) continue;
            if (rule.TimeSignature != timeSignature) continue;

            decimal confidence = 0.5m;

            var bpmRange = rule.BpmMax - rule.BpmMin;
            var bpmCenter = rule.BpmMin + bpmRange / 2m;
            var bpmDist = Math.Abs(bpm - bpmCenter) / (bpmRange / 2m);
            confidence += (1m - bpmDist) * 0.3m;

            if (energy.HasValue && rule.EnergyMin.HasValue && rule.EnergyMax.HasValue)
            {
                if (energy >= rule.EnergyMin && energy <= rule.EnergyMax)
                    confidence += 0.1m;
                else
                    confidence -= 0.1m;
            }

            if (valence.HasValue && rule.ValenceMin.HasValue && rule.ValenceMax.HasValue)
            {
                if (valence >= rule.ValenceMin && valence <= rule.ValenceMax)
                    confidence += 0.1m;
                else
                    confidence -= 0.1m;
            }

            confidence = Math.Clamp(confidence, 0.05m, 0.99m);

            results.Add(new DanceClassificationResult(
                rule.Name, Math.Round(confidence, 2), "rules", (int?)bpm));
        }

        return results.OrderByDescending(r => r.Confidence).ToList();
    }

    private static readonly List<DanceRule> DanceRules = new()
    {
        // Standard
        new("Walc wiedeński", 58, 62, 3, null, null, null, null),
        new("Walc angielski", 28, 32, 3, 0.1m, 0.4m, 0.1m, 0.5m),
        new("Tango", 30, 34, 4, 0.3m, 0.6m, 0.0m, 0.3m),
        new("Foxtrot", 28, 32, 4, 0.3m, 0.6m, 0.3m, 0.7m),
        new("Quickstep", 48, 54, 4, 0.6m, 0.9m, 0.5m, 0.9m),

        // Latin
        new("Cha-cha", 28, 34, 4, 0.5m, 0.8m, 0.5m, 0.9m),
        new("Samba", 48, 54, 4, 0.6m, 0.9m, 0.6m, 1.0m),
        new("Rumba", 24, 28, 4, 0.2m, 0.5m, 0.2m, 0.6m),
        new("Paso doble", 58, 62, 4, 0.6m, 0.9m, 0.2m, 0.5m),
        new("Jive", 40, 46, 4, 0.7m, 1.0m, 0.7m, 1.0m),

        // Social / popular
        new("Salsa", 70, 100, 4, 0.5m, 0.9m, 0.5m, 0.9m),
        new("Bachata", 120, 140, 4, 0.3m, 0.6m, 0.3m, 0.7m),
        new("Kizomba", 80, 110, 4, 0.2m, 0.5m, 0.3m, 0.6m),
        new("West Coast Swing", 90, 120, 4, 0.3m, 0.7m, 0.3m, 0.8m),
        new("Lindy Hop", 120, 180, 4, 0.6m, 0.9m, 0.6m, 0.9m),
        new("Hustle", 100, 120, 4, 0.6m, 0.9m, 0.6m, 0.9m),
        new("Polka", 120, 140, 4, 0.6m, 0.9m, 0.7m, 1.0m),

        // Argentine
        new("Tango argentyńskie", 55, 80, 4, 0.3m, 0.6m, 0.0m, 0.4m),
        new("Milonga", 80, 110, 4, 0.5m, 0.8m, 0.3m, 0.6m),
        new("Vals (tango walc)", 60, 80, 3, 0.3m, 0.6m, 0.2m, 0.6m),
    };

    private record DanceRule(
        string Name, int BpmMin, int BpmMax, int TimeSignature,
        decimal? EnergyMin, decimal? EnergyMax,
        decimal? ValenceMin, decimal? ValenceMax);
}
