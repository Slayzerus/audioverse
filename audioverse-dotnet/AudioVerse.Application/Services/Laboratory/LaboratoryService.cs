using System.Diagnostics;
using System.IO.Compression;
using System.Net.Http.Json;
using System.Text.Json;
using AudioVerse.Application.Models.Laboratory;
using AudioVerse.Application.Services.Utils;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AudioVerse.Application.Services.Laboratory;

/// <summary>
/// Default implementation of <see cref="ILaboratoryService"/>.
/// Delegates pitch detection to <see cref="IAiAudioService"/> (CREPE)
/// and calls audio_pitch /pitch/pyin directly via HttpClient for pYIN.
/// </summary>
public class LaboratoryService : ILaboratoryService
{
    private const string LabBucket = "lab-experiments";

    private readonly IAiAudioService _aiAudio;
    private readonly AiAudioOptions _opts;
    private readonly IHttpClientFactory _httpFactory;
    private readonly AudioVerseDbContext _db;
    private readonly IFileStorage? _fileStorage;
    private readonly ILogger<LaboratoryService> _logger;

    public LaboratoryService(
        IAiAudioService aiAudio,
        IOptions<AiAudioOptions> opts,
        IHttpClientFactory httpFactory,
        AudioVerseDbContext db,
        ILogger<LaboratoryService> logger,
        IFileStorage? fileStorage = null)
    {
        _aiAudio = aiAudio;
        _opts = opts.Value;
        _httpFactory = httpFactory;
        _db = db;
        _logger = logger;
        _fileStorage = fileStorage;
    }

    public async Task<(Models.Utils.PitchResult? Result, long LatencyMs)> DetectPitchCrepeAsync(byte[] audio, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        var result = await _aiAudio.DetectPitchAsync(new MemoryStream(audio), ct);
        sw.Stop();
        return (result, sw.ElapsedMilliseconds);
    }

    public async Task<(PitchRawResponse? Result, long LatencyMs)> DetectPitchPyinAsync(byte[] audio, string fileName, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_opts.PitchBaseUrl))
            return (null, -1);

        var sw = Stopwatch.StartNew();
        using var http = _httpFactory.CreateClient();
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(audio), "file", fileName);

        var resp = await http.PostAsync($"{_opts.PitchBaseUrl.TrimEnd('/')}/pitch/pyin", form, ct);
        sw.Stop();

        if (!resp.IsSuccessStatusCode)
            return (null, sw.ElapsedMilliseconds);

        var raw = await resp.Content.ReadFromJsonAsync<PitchRawResponse>(ct);
        return (raw, sw.ElapsedMilliseconds);
    }

    public ComparisonMetrics ComputeMetrics(double[] a, double[] b)
    {
        var len = Math.Min(a.Length, b.Length);
        if (len == 0) return new ComparisonMetrics(0, 0, 0, 0, 0);

        var aT = a[..len];
        var bT = b[..len];

        var rmseHz = Math.Sqrt(aT.Zip(bT).Average(p => Math.Pow(p.First - p.Second, 2)));

        var centErrors = aT.Zip(bT)
            .Where(p => p.First > 1 && p.Second > 1)
            .Select(p => Math.Abs(1200.0 * Math.Log2(p.First / p.Second)))
            .ToArray();
        var rmseCents = centErrors.Length > 0 ? Math.Sqrt(centErrors.Average(x => x * x)) : 0;

        var accuracy50c = centErrors.Length > 0
            ? centErrors.Count(c => c <= 50) / (double)centErrors.Length
            : 0;

        var meanA = aT.Average();
        var meanB = bT.Average();
        var num = aT.Zip(bT).Sum(p => (p.First - meanA) * (p.Second - meanB));
        var den = Math.Sqrt(aT.Sum(x => Math.Pow(x - meanA, 2)) * bT.Sum(x => Math.Pow(x - meanB, 2)));
        var pearson = den > 0 ? num / den : 0;

        return new ComparisonMetrics(
            RmseHz: Math.Round(rmseHz, 3),
            RmseCents: Math.Round(rmseCents, 1),
            Accuracy50c: Math.Round(accuracy50c, 3),
            PearsonR: Math.Round(pearson, 3),
            ComparedFrames: len);
    }

    public async Task<BenchmarkEntry> MeasureAsync(int runs, Func<Task> action)
    {
        var times = new List<long>(runs);
        for (var i = 0; i < runs; i++)
        {
            var sw = Stopwatch.StartNew();
            try { await action(); }
            catch { /* measure time even on failure */ }
            sw.Stop();
            times.Add(sw.ElapsedMilliseconds);
        }

        var avg = times.Average();
        var std = Math.Sqrt(times.Average(t => Math.Pow(t - avg, 2)));
        return new BenchmarkEntry(
            AvgMs: Math.Round(avg, 1),
            MinMs: times.Min(),
            MaxMs: times.Max(),
            StdDevMs: Math.Round(std, 1),
            Available: times.Count > 0);
    }

    public async Task<Dictionary<string, string>> CollectHealthAsync(CancellationToken ct)
    {
        var services = new Dictionary<string, string>
        {
            ["audio_pitch"] = _opts.PitchBaseUrl,
            ["sing_score"] = _opts.SingingScoreBaseUrl,
            ["audio_separate"] = _opts.SeparateBaseUrl,
            ["audio_rhythm"] = _opts.RhythmBaseUrl,
            ["audio_vad"] = _opts.VadBaseUrl,
            ["audio_analysis"] = _opts.AudioAnalysisBaseUrl,
        };

        var result = new Dictionary<string, string>();
        using var http = _httpFactory.CreateClient();
        http.Timeout = TimeSpan.FromSeconds(3);

        foreach (var (name, url) in services)
        {
            if (string.IsNullOrEmpty(url))
            {
                result[name] = "not configured";
                continue;
            }

            try
            {
                var r = await http.GetAsync($"{url.TrimEnd('/')}/health", ct);
                result[name] = r.IsSuccessStatusCode ? "ok" : $"error ({(int)r.StatusCode})";
            }
            catch
            {
                result[name] = "unreachable";
            }
        }

        return result;
    }

    public async Task<List<BenchmarkRow>> CollectBenchmarkAsync(byte[] audio, int runs, CancellationToken ct)
    {
        var rows = new List<BenchmarkRow>();

        rows.Add((await MeasureAsync(runs, async () =>
            await _aiAudio.DetectPitchAsync(new MemoryStream(audio), ct))).ToRow("CREPE (audio_pitch)"));

        rows.Add((await MeasureAsync(runs, async () =>
            await _aiAudio.DetectRhythmAsync(new MemoryStream(audio), ct))).ToRow("Rhythm (audio_rhythm)"));

        rows.Add((await MeasureAsync(runs, async () =>
            await _aiAudio.DetectVoiceActivityAsync(new MemoryStream(audio), ct))).ToRow("VAD (audio_vad)"));

        rows.Add((await MeasureAsync(runs, async () =>
            await _aiAudio.AnalyzeAsync(new MemoryStream(audio), ct))).ToRow("Analysis (audio_analysis)"));

        if (!string.IsNullOrEmpty(_opts.PitchBaseUrl))
        {
            rows.Add((await MeasureAsync(runs, async () =>
            {
                using var http = _httpFactory.CreateClient();
                using var form = new MultipartFormDataContent();
                form.Add(new ByteArrayContent(audio), "file", "bench.wav");
                await http.PostAsync($"{_opts.PitchBaseUrl.TrimEnd('/')}/pitch/pyin", form, ct);
            })).ToRow("pYIN (audio_pitch)"));
        }

        return rows;
    }

    public byte[] ExtractVocalFromZip(byte[] zipBytes)
    {
        using var ms = new MemoryStream(zipBytes);
        using var zip = new ZipArchive(ms, ZipArchiveMode.Read);
        var vocalEntry = zip.Entries.FirstOrDefault(e =>
            e.Name.Contains("vocal", StringComparison.OrdinalIgnoreCase));
        if (vocalEntry is null) return zipBytes;
        using var entryStream = vocalEntry.Open();
        using var result = new MemoryStream();
        entryStream.CopyTo(result);
        return result.ToArray();
    }

    public async Task<LaboratoryExperiment> SaveExperimentAsync(LaboratoryReportData data, CancellationToken ct)
    {
        var crepeRows = data.ComparisonRows?.Where(r => r.Algorithm == "CREPE").ToList() ?? [];
        var pyinRows = data.ComparisonRows?.Where(r => r.Algorithm == "pYIN").ToList() ?? [];

        var experiment = new LaboratoryExperiment
        {
            Title = data.ReportTitle ?? "Untitled experiment",
            Operator = data.Operator,
            ExecutedAt = data.ExperimentDate,
            BenchmarkRuns = data.BenchmarkRuns,
            FileCount = data.TestedFiles?.Count ?? 0,
            ApiVersion = data.ApiVersion,
            CrepeAvgRmseCents = crepeRows.Count > 0 ? Math.Round(crepeRows.Average(r => r.RmseCents), 1) : null,
            CrepeAvgAccuracy50c = crepeRows.Count > 0 ? Math.Round(crepeRows.Average(r => r.Accuracy50c), 3) : null,
            CrepeAvgPearsonR = crepeRows.Count > 0 ? Math.Round(crepeRows.Average(r => r.PearsonR), 3) : null,
            CrepeAvgLatencyMs = crepeRows.Count > 0 ? Math.Round(crepeRows.Average(r => r.LatencyMs), 1) : null,
            PyinAvgRmseCents = pyinRows.Count > 0 ? Math.Round(pyinRows.Average(r => r.RmseCents), 1) : null,
            PyinAvgAccuracy50c = pyinRows.Count > 0 ? Math.Round(pyinRows.Average(r => r.Accuracy50c), 3) : null,
            PyinAvgPearsonR = pyinRows.Count > 0 ? Math.Round(pyinRows.Average(r => r.PearsonR), 3) : null,
            PyinAvgLatencyMs = pyinRows.Count > 0 ? Math.Round(pyinRows.Average(r => r.LatencyMs), 1) : null,
            SeparationAvgDeltaRmseCents = data.SeparationRows?.Count > 0
                ? Math.Round(data.SeparationRows.Average(r => r.RmseCentsAfter - r.RmseCentsBefore), 1)
                : null,
            DtwScore = data.DtwRows?.FirstOrDefault()?.Score,
            ResultsJson = JsonSerializer.Serialize(data),
        };

        // Build per-file sample records
        var fileNames = data.TestedFiles ?? [];
        foreach (var fileName in fileNames)
        {
            var crepe = crepeRows.FirstOrDefault(r => r.FileName == fileName);
            var pyin = pyinRows.FirstOrDefault(r => r.FileName == fileName);
            var sep = data.SeparationRows?.FirstOrDefault(r => r.FileName == fileName);

            experiment.Samples.Add(new LaboratoryExperimentSample
            {
                FileName = fileName,
                CrepeRmseCents = crepe?.RmseCents,
                CrepeAccuracy50c = crepe?.Accuracy50c,
                CrepePearsonR = crepe?.PearsonR,
                CrepeLatencyMs = crepe?.LatencyMs,
                PyinRmseCents = pyin?.RmseCents,
                PyinAccuracy50c = pyin?.Accuracy50c,
                PyinPearsonR = pyin?.PearsonR,
                PyinLatencyMs = pyin?.LatencyMs,
                SeparationRmseCentsBefore = sep?.RmseCentsBefore,
                SeparationRmseCentsAfter = sep?.RmseCentsAfter,
                SeparationLatencyMs = sep?.SeparationLatencyMs,
            });
        }

        _db.LaboratoryExperiments.Add(experiment);
        await _db.SaveChangesAsync(ct);
        return experiment;
    }

    public async Task<LaboratoryExperiment> SaveExperimentAsync(
        LaboratoryReportData data,
        Dictionary<string, byte[]> audioSamples,
        CancellationToken ct)
    {
        var experiment = await SaveExperimentAsync(data, ct);

        if (_fileStorage is null || audioSamples.Count == 0)
            return experiment;

        try
        {
            await _fileStorage.EnsureBucketExistsAsync(LabBucket, ct);

            foreach (var sample in experiment.Samples)
            {
                if (!audioSamples.TryGetValue(sample.FileName, out var bytes))
                    continue;

                var key = $"{experiment.ExperimentGuid:D}/{sample.FileName}";
                await using var stream = new MemoryStream(bytes);
                await _fileStorage.UploadAsync(LabBucket, key, stream, "audio/wav", ct);
                sample.StoragePath = key;
                sample.FileSizeBytes = bytes.Length;
            }

            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to upload audio samples to MinIO for experiment {Guid}", experiment.ExperimentGuid);
        }

        return experiment;
    }

    public async Task<string?> GetSampleDownloadUrlAsync(Guid experimentGuid, string fileName, CancellationToken ct)
    {
        if (_fileStorage is null) return null;

        var sample = await _db.LaboratoryExperimentSamples
            .FirstOrDefaultAsync(s => s.Experiment!.ExperimentGuid == experimentGuid
                && s.FileName == fileName, ct);

        if (sample?.StoragePath is null) return null;

        return await _fileStorage.GetPresignedUrlAsync(LabBucket, sample.StoragePath, TimeSpan.FromMinutes(30));
    }

    public async Task<LaboratoryExperiment?> GetExperimentAsync(Guid experimentGuid, CancellationToken ct)
    {
        return await _db.LaboratoryExperiments
            .Include(e => e.Samples)
            .FirstOrDefaultAsync(e => e.ExperimentGuid == experimentGuid, ct);
    }

    public async Task<List<LaboratoryExperiment>> ListExperimentsAsync(int take, CancellationToken ct)
    {
        return await _db.LaboratoryExperiments
            .OrderByDescending(e => e.ExecutedAt)
            .Take(take)
            .ToListAsync(ct);
    }
}
