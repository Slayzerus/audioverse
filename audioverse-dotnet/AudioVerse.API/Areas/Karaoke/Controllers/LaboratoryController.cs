using AudioVerse.API.Models.Requests.Karaoke;
using AudioVerse.API.Services;
using AudioVerse.Application.Models.Laboratory;
using AudioVerse.Application.Services.Laboratory;
using AudioVerse.Application.Services.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace AudioVerse.API.Areas.Karaoke.Controllers;

/// <summary>
/// Laboratory controller for pitch detection experiments.
/// Provides endpoints for comparing CREPE vs pYIN, measuring AI microservice
/// latency, evaluating Demucs separation impact, DTW singing scoring,
/// and generating a branded PDF report with all results.
/// </summary>
[ApiController]
[Route("api/karaoke/lab")]
[Produces("application/json")]
[Tags("Karaoke - Laboratory")]
[Authorize(Roles = "Admin")]
public class LaboratoryController(
    IAiAudioService aiAudio,
    ILaboratoryService lab) : ControllerBase
{
    // ── Pitch detection ──────────────────────────────────────────────────
    // NOTE: Single CREPE detection → use production endpoint: POST /api/ai/audio/pitch
    // NOTE: Single DTW scoring → use: IAiAudioService.ScoreSingingAsync (or POST /api/ai/audio/score)
    // Lab endpoints below provide comparison, batch, and experiment features only.

    /// <summary>Detect F0 using the pYIN algorithm (probabilistic YIN, librosa).</summary>
    [HttpPost("pitch/pyin")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> PitchPyin(IFormFile file, CancellationToken ct)
    {
        if (file is not { Length: > 0 })
            return BadRequest(new { error = "Audio file required." });

        var bytes = await ReadFileAsync(file, ct);
        var (result, latencyMs) = await lab.DetectPitchPyinAsync(bytes, file.FileName, ct);

        if (result is null)
            return StatusCode(503, new { error = "audio_pitch /pitch/pyin unavailable." });

        return Ok(new
        {
            algorithm = "pYIN",
            latencyMs,
            medianHz = result.MedianHz,
            frameCount = result.Track?.Length ?? 0,
            track = result.Track
        });
    }

    /// <summary>
    /// Run both CREPE and pYIN on the same audio file and return side-by-side results
    /// with comparison metrics: RMSE (Hz and cents), Accuracy@50c, Pearson correlation.
    /// </summary>
    [HttpPost("pitch/compare")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> PitchCompare(IFormFile file, CancellationToken ct)
    {
        if (file is not { Length: > 0 })
            return BadRequest(new { error = "Audio file required." });

        var bytes = await ReadFileAsync(file, ct);

        var (crepeResult, crepeMs) = await lab.DetectPitchCrepeAsync(bytes, ct);
        var (pyinResult, pyinMs) = await lab.DetectPitchPyinAsync(bytes, file.FileName, ct);

        ComparisonMetrics? metrics = null;
        if (crepeResult is not null && pyinResult?.Track is { Length: > 0 })
        {
            var crepeHz = crepeResult.FrequenciesHz.Select(x => (double)x).ToArray();
            var pyinHz = pyinResult.Track.Select(f => f.Hz).ToArray();
            metrics = lab.ComputeMetrics(crepeHz, pyinHz);
        }

        return Ok(new
        {
            crepe = crepeResult is null ? null : new
            {
                algorithm = "CREPE",
                latencyMs = crepeMs,
                medianHz = crepeResult.MedianHz,
                frameCount = crepeResult.FrequenciesHz.Length,
                track = crepeResult.TimestampsMs
                    .Zip(crepeResult.FrequenciesHz, (t, hz) => new { t, hz }).ToArray()
            },
            pyin = pyinResult is null ? null : new
            {
                algorithm = "pYIN",
                latencyMs = pyinMs,
                medianHz = pyinResult.MedianHz,
                frameCount = pyinResult.Track?.Length ?? 0,
                track = pyinResult.Track
            },
            comparison = metrics
        });
    }

    // ── Separation effect ────────────────────────────────────────────────

    /// <summary>
    /// Compare pitch detection with and without Demucs source separation.
    /// Pipeline: (a) CREPE on original; (b) Demucs -> vocal -> CREPE on vocal.
    /// </summary>
    [HttpPost("pitch/separation-effect")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> PitchSeparationEffect(IFormFile file, CancellationToken ct)
    {
        if (file is not { Length: > 0 })
            return BadRequest(new { error = "Audio file required." });

        var bytes = await ReadFileAsync(file, ct);

        var (rawPitch, rawMs) = await lab.DetectPitchCrepeAsync(bytes, ct);

        var swSep = Stopwatch.StartNew();
        byte[]? vocalBytes = null;
        string? separationError = null;
        try
        {
            var zipBytes = await aiAudio.SeparateAsync(new MemoryStream(bytes), stems: 2, ct);
            vocalBytes = lab.ExtractVocalFromZip(zipBytes);
        }
        catch (Exception ex)
        {
            separationError = ex.Message;
        }
        swSep.Stop();

        long pitchAfterSepMs = -1;
        Application.Models.Utils.PitchResult? sepPitch = null;
        if (vocalBytes is not null)
        {
            (sepPitch, pitchAfterSepMs) = await lab.DetectPitchCrepeAsync(vocalBytes, ct);
        }

        ComparisonMetrics? metrics = null;
        if (rawPitch is not null && sepPitch is not null)
        {
            var raw = rawPitch.FrequenciesHz.Select(x => (double)x).ToArray();
            var sep = sepPitch.FrequenciesHz.Select(x => (double)x).ToArray();
            metrics = lab.ComputeMetrics(raw, sep);
        }

        return Ok(new
        {
            original = rawPitch is null ? null : new
            {
                latencyMs = rawMs,
                medianHz = rawPitch.MedianHz,
                frameCount = rawPitch.FrequenciesHz.Length,
                track = rawPitch.TimestampsMs
                    .Zip(rawPitch.FrequenciesHz, (t, hz) => new { t, hz }).ToArray()
            },
            separation = new { latencyMs = swSep.ElapsedMilliseconds, error = separationError },
            afterSeparation = sepPitch is null ? null : new
            {
                latencyMs = pitchAfterSepMs,
                medianHz = sepPitch.MedianHz,
                frameCount = sepPitch.FrequenciesHz.Length,
                track = sepPitch.TimestampsMs
                    .Zip(sepPitch.FrequenciesHz, (t, hz) => new { t, hz }).ToArray()
            },
            comparison = metrics
        });
    }

    // ── Benchmark ────────────────────────────────────────────────────────

    /// <summary>Benchmark latency of all AI microservices (N repeated calls, returns avg/min/max/stddev).</summary>
    [HttpPost("benchmark/latency")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> BenchmarkLatency(IFormFile file, [FromQuery] int runs = 5, CancellationToken ct = default)
    {
        if (file is not { Length: > 0 })
            return BadRequest(new { error = "Audio file required (short fragment, 2-5 s)." });
        if (runs is < 1 or > 20) runs = 5;

        var bytes = await ReadFileAsync(file, ct);
        var results = await lab.CollectBenchmarkAsync(bytes, runs, ct);

        return Ok(new
        {
            runs,
            fileSizeKb = Math.Round(bytes.Length / 1024.0, 1),
            results
        });
    }

    // ── Batch ────────────────────────────────────────────────────────────

    /// <summary>Batch CREPE pitch detection on up to 20 files. Returns CSV-friendly rows.</summary>
    [HttpPost("batch/pitch")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> BatchPitch([FromForm] List<IFormFile> files, CancellationToken ct)
    {
        if (files is not { Count: > 0 })
            return BadRequest(new { error = "At least one file required." });
        if (files.Count > 20)
            return BadRequest(new { error = "Maximum 20 files at once." });

        var rows = new List<object>();
        foreach (var file in files)
        {
            var bytes = await ReadFileAsync(file, ct);
            var (result, latencyMs) = await lab.DetectPitchCrepeAsync(bytes, ct);

            if (result is null)
            {
                rows.Add(new { fileName = file.FileName, error = "Unavailable" });
                continue;
            }

            var voicedFrames = result.FrequenciesHz.Count(hz => hz > 1m);
            rows.Add(new
            {
                fileName = file.FileName,
                medianHz = result.MedianHz,
                noteName = result.NoteName,
                voicedFrames,
                totalFrames = result.FrequenciesHz.Length,
                voicedRatio = result.FrequenciesHz.Length > 0
                    ? Math.Round((double)voicedFrames / result.FrequenciesHz.Length, 3)
                    : 0,
                latencyMs
            });
        }

        return Ok(new { count = rows.Count, rows });
    }

    // ── Health ────────────────────────────────────────────────────────────

    /// <summary>Check health of all configured AI microservices.</summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<IActionResult> Health(CancellationToken ct)
    {
        var results = await lab.CollectHealthAsync(ct);
        return Ok(results);
    }

    // ── PDF Report ───────────────────────────────────────────────────────

    /// <summary>
    /// Run the full experiment pipeline and generate a branded AudioVerse PDF report.
    /// Includes: health check, CREPE vs pYIN comparison, Demucs separation effect,
    /// DTW scoring, latency benchmark, auto-generated conclusions.
    /// </summary>
    [HttpPost("report/pdf")]
    [Consumes("multipart/form-data")]
    [Produces("application/pdf")]
    [AllowAnonymous]
    public async Task<IActionResult> GenerateReport(
        [FromForm] GenerateLabReportRequest request,
        CancellationToken ct = default)
    {
        var benchmarkRuns = request.BenchmarkRuns is < 1 or > 10 ? 3 : request.BenchmarkRuns;
        var audioFiles = request.AudioFiles;

        var data = new LaboratoryReportData
        {
            ReportTitle = request.ReportTitle ?? "Pitch Detection Algorithm Comparison: CREPE vs pYIN",
            Operator = request.OperatorName ?? User.FindFirst("username")?.Value ?? "Administrator",
            ExperimentDate = DateTime.UtcNow,
            BenchmarkRuns = benchmarkRuns,
            ApiVersion = "AudioVerse.API .NET 10",
            TestedFiles = audioFiles.Select(f => f.FileName).ToList(),
        };

        // 1. Health
        data.HealthResults = await lab.CollectHealthAsync(ct);

        // 2. Benchmark
        if (audioFiles.Count > 0)
        {
            var benchBytes = await ReadFileAsync(audioFiles[0], ct);
            data.BenchmarkResults = await lab.CollectBenchmarkAsync(benchBytes, benchmarkRuns, ct);
        }

        // 3. Calibration tone (synthetic ground truth)
        data.CalibrationRows = [];
        var (calWav, calRefHz, _) = SyntheticCalibration.Generate();
        var (calCrepe, calCrepeMs) = await lab.DetectPitchCrepeAsync(calWav, ct);
        var (calPyin, calPyinMs) = await lab.DetectPitchPyinAsync(calWav, SyntheticCalibration.FileName, ct);

        if (calCrepe is not null)
        {
            var ca = calCrepe.FrequenciesHz.Select(x => (double)x).ToArray();
            var mCal = lab.ComputeMetrics(ca, calRefHz);
            data.CalibrationRows.Add(new ComparisonRow(
                SyntheticCalibration.FileName, "CREPE",
                mCal.RmseHz, mCal.RmseCents, mCal.Accuracy50c, mCal.PearsonR, calCrepeMs));
        }
        if (calPyin?.Track is { Length: > 0 })
        {
            var pa = calPyin.Track.Select(f => f.Hz).ToArray();
            var mCal = lab.ComputeMetrics(pa, calRefHz);
            data.CalibrationRows.Add(new ComparisonRow(
                SyntheticCalibration.FileName, "pYIN",
                mCal.RmseHz, mCal.RmseCents, mCal.Accuracy50c, mCal.PearsonR, calPyinMs));
        }

        // 4. CREPE vs pYIN per file
        data.ComparisonRows = [];
        data.SeparationRows = [];
        data.PitchContours   = [];
        var audioSamples = new Dictionary<string, byte[]>();

        foreach (var file in audioFiles.Take(10))
        {
            var bytes = await ReadFileAsync(file, ct);
            audioSamples[file.FileName] = bytes;

            var (crepe, crepeMs) = await lab.DetectPitchCrepeAsync(bytes, ct);
            var (pyin, pyinMs) = await lab.DetectPitchPyinAsync(bytes, file.FileName, ct);

            if (crepe is not null)
                data.ComparisonRows.Add(new ComparisonRow(file.FileName, "CREPE", 0, 0, 0, 0, crepeMs));
            if (pyin?.Track is { Length: > 0 })
                data.ComparisonRows.Add(new ComparisonRow(file.FileName, "pYIN", 0, 0, 0, 0, pyinMs));

            if (crepe is not null && pyin?.Track is { Length: > 0 })
            {
                var ca = crepe.FrequenciesHz.Select(x => (double)x).ToArray();
                var pa = pyin.Track.Select(f => f.Hz).ToArray();
                var m = lab.ComputeMetrics(ca, pa);

                var idx = data.ComparisonRows.Count - 2;
                data.ComparisonRows[idx] = data.ComparisonRows[idx] with
                {
                    RmseHz = m.RmseHz, RmseCents = m.RmseCents,
                    Accuracy50c = m.Accuracy50c, PearsonR = m.PearsonR
                };
                data.ComparisonRows[idx + 1] = data.ComparisonRows[idx + 1] with
                {
                    RmseHz = m.RmseHz, RmseCents = m.RmseCents,
                    Accuracy50c = m.Accuracy50c, PearsonR = m.PearsonR
                };

                // Separation effect for the first file only
                if (data.SeparationRows.Count == 0)
                {
                    try
                    {
                        var swSep = Stopwatch.StartNew();
                        var zipBytes = await aiAudio.SeparateAsync(new MemoryStream(bytes), 2, ct);
                        var vocalBytes = lab.ExtractVocalFromZip(zipBytes);
                        swSep.Stop();

                        var (sepPitch, _) = await lab.DetectPitchCrepeAsync(vocalBytes, ct);
                        if (sepPitch is not null)
                        {
                            var sa = sepPitch.FrequenciesHz.Select(x => (double)x).ToArray();
                            var mSep = lab.ComputeMetrics(ca, sa);
                            data.SeparationRows.Add(new SeparationRow(
                                file.FileName, m.RmseCents, mSep.RmseCents, swSep.ElapsedMilliseconds));
                        }
                    }
                    catch { /* separation is optional */ }
                }

                // F0 pitch contour series (drives trajectory chart in PDF)
                const int MaxContourPoints = 500;
                int stepC = Math.Max(1, crepe.FrequenciesHz.Length / MaxContourPoints);
                int stepP = Math.Max(1, pyin.Track.Length / MaxContourPoints);
                data.PitchContours.Add(new PitchContourSeries(
                    file.FileName, "CREPE",
                    crepe.FrequenciesHz
                        .Zip(crepe.TimestampsMs, (hz, t) => new PitchContourPoint((double)t, (double)hz))
                        .Where((_, i) => i % stepC == 0)
                        .ToList()));
                data.PitchContours.Add(new PitchContourSeries(
                    file.FileName, "pYIN",
                    pyin.Track
                        .Where((_, i) => i % stepP == 0)
                        .Select(p => new PitchContourPoint(p.T, p.Hz))
                        .ToList()));
            }
        }

        // 4. DTW
        data.DtwRows = [];
        if (request.VocalFile is { Length: > 0 } && request.ReferenceFile is { Length: > 0 })
        {
            var sw = Stopwatch.StartNew();
            await using var vs = request.VocalFile.OpenReadStream();
            await using var rs = request.ReferenceFile.OpenReadStream();
            var score = await aiAudio.ScoreSingingAsync(vs, rs, ct);
            sw.Stop();
            if (score is not null)
                data.DtwRows.Add(new DtwRow(
                    request.VocalFile.FileName, score.Score,
                    score.PitchAccuracy, score.RhythmAccuracy,
                    sw.ElapsedMilliseconds));
        }

        // 5. Persist experiment + upload audio samples to MinIO
        var experiment = await lab.SaveExperimentAsync(data, audioSamples, ct);

        // 6. Generate PDF with experiment GUID (embedded in QR code)
        var pdfBytes = LaboratoryReportPdfService.Generate(data, experiment.ExperimentGuid);
        var fileName = $"AudioVerse_Lab_Report_{DateTime.UtcNow:yyyyMMdd_HHmmss}.pdf";
        return File(pdfBytes, "application/pdf", fileName);
    }

    // ── Experiment history ────────────────────────────────────────────────

    /// <summary>List recent laboratory experiments (newest first, default 20).</summary>
    [HttpGet("experiments")]
    public async Task<IActionResult> ListExperiments([FromQuery] int take = 20, CancellationToken ct = default)
    {
        var experiments = await lab.ListExperimentsAsync(take, ct);
        return Ok(experiments.Select(e => new
        {
            e.Id,
            e.ExperimentGuid,
            e.Title,
            e.Operator,
            e.ExecutedAt,
            e.FileCount,
            e.CrepeAvgRmseCents,
            e.PyinAvgRmseCents,
            e.DtwScore
        }));
    }

    /// <summary>Get a specific experiment by its unique GUID.</summary>
    [HttpGet("experiments/{guid:guid}")]
    public async Task<IActionResult> GetExperiment(Guid guid, CancellationToken ct)
    {
        var experiment = await lab.GetExperimentAsync(guid, ct);
        if (experiment is null) return NotFound();
        return Ok(experiment);
    }

    /// <summary>Re-generate a PDF report from a previously saved experiment.</summary>
    [HttpGet("experiments/{guid:guid}/pdf")]
    [Produces("application/pdf")]
    [AllowAnonymous]
    public async Task<IActionResult> RegenerateReport(Guid guid, CancellationToken ct)
    {
        var experiment = await lab.GetExperimentAsync(guid, ct);
        if (experiment is null) return NotFound();

        var data = System.Text.Json.JsonSerializer.Deserialize<LaboratoryReportData>(experiment.ResultsJson ?? "{}");
        if (data is null) return StatusCode(500, new { error = "Failed to deserialize experiment data." });

        var pdfBytes = LaboratoryReportPdfService.Generate(data, experiment.ExperimentGuid);
        var fileName = $"AudioVerse_Lab_Report_{experiment.ExecutedAt:yyyyMMdd_HHmmss}.pdf";
        return File(pdfBytes, "application/pdf", fileName);
    }

    /// <summary>Get a presigned download URL for an audio sample stored in MinIO.</summary>
    [HttpGet("experiments/{guid:guid}/samples/{fileName}")]
    public async Task<IActionResult> GetSampleUrl(Guid guid, string fileName, CancellationToken ct)
    {
        var url = await lab.GetSampleDownloadUrlAsync(guid, fileName, ct);
        if (url is null) return NotFound(new { error = "Sample not found or storage unavailable." });
        return Ok(new { downloadUrl = url, expiresInMinutes = 30 });
    }

    /// <summary>List stored audio samples for an experiment.</summary>
    [HttpGet("experiments/{guid:guid}/samples")]
    public async Task<IActionResult> ListSamples(Guid guid, CancellationToken ct)
    {
        var experiment = await lab.GetExperimentAsync(guid, ct);
        if (experiment is null) return NotFound();
        return Ok(experiment.Samples.Select(s => new
        {
            s.FileName,
            s.FileSizeBytes,
            stored = s.StoragePath is not null,
            s.StoragePath
        }));
    }

    // ── Private helpers ──────────────────────────────────────────────────

    private static async Task<byte[]> ReadFileAsync(IFormFile file, CancellationToken ct)
    {
        var bytes = new byte[file.Length];
        await using var s = file.OpenReadStream();
        await s.ReadExactlyAsync(bytes, ct);
        return bytes;
    }
}
