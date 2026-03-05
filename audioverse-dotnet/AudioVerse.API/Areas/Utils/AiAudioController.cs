using AudioVerse.Application.Models.Utils;
using AudioVerse.Application.Services.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;

namespace AudioVerse.API.Areas.Utils;

/// <summary>
/// AI-powered audio processing services: transcription, TTS, analysis, separation, voice conversion.
/// </summary>
[ApiController]
[Route("api/ai/audio")]
[Authorize]
[Produces("application/json")]
[Tags("AI - Audio")]
public class AiAudioController : ControllerBase
{
    /// <summary>
    /// Transcribe audio to text using AI (speech-to-text).
    /// </summary>
    /// <param name="audio">Audio file (WAV, MP3, FLAC, etc.)</param>
    /// <param name="language">Optional language code (e.g., "en", "pl")</param>
    /// <returns>Transcription result with text and timestamps</returns>
    /// <summary>Post transcribe.</summary>
    [HttpPost("transcribe")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> Transcribe(IFormFile audio, [FromForm] string? language)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });
        using var stream = audio.OpenReadStream();
        var result = await svc.TranscribeAsync(stream, language);
        return result != null ? Ok(result) : StatusCode(502, new { Message = "AI service unavailable" });
    }

    /// <summary>
    /// Synthesize speech from text (text-to-speech).
    /// </summary>
    /// <param name="request">TTS request with text and optional voice</param>
    /// <returns>WAV audio file</returns>
    [HttpPost("synthesize")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Synthesize([FromBody] TtsRequest request)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });
        var bytes = await svc.SynthesizeAsync(request.Text, request.Voice);
        return File(bytes, "audio/wav", "speech.wav");
    }

    /// <summary>
    /// Analyze audio file properties (BPM, key, loudness, etc.).
    /// </summary>
    /// <param name="audio">Audio file to analyze</param>
    /// <returns>Analysis results with detected properties</returns>
    [HttpPost("analyze")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> Analyze(IFormFile audio)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });
        using var stream = audio.OpenReadStream();
        var result = await svc.AnalyzeAsync(stream);
        return result != null ? Ok(result) : StatusCode(502, new { Message = "AI service unavailable" });
    }

    /// <summary>
    /// Separate audio into stems (vocals, drums, bass, other).
    /// </summary>
    /// <param name="audio">Audio file to separate</param>
    /// <param name="stems">Number of stems: 2 (vocals/instrumental) or 4 (full separation)</param>
    /// <returns>ZIP archive with separated stems</returns>
    /// <summary>Separate.</summary>
    [HttpPost("separate")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Separate(IFormFile audio, [FromForm] int stems = 2)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });
        using var stream = audio.OpenReadStream();
        var bytes = await svc.SeparateAsync(stream, stems);
        return File(bytes, "application/zip", "stems.zip");
    }

    /// <summary>
    /// Convert voice using RVC (Retrieval-based Voice Conversion).
    /// </summary>
    /// <param name="audio">Source audio with vocals</param>
    /// <param name="targetSinger">Target voice/singer model name</param>
    /// <param name="key">Optional pitch shift in semitones</param>
    /// <returns>WAV audio with converted voice</returns>
    /// <summary>Rvc Convert.</summary>
    [HttpPost("rvc")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RvcConvert(IFormFile audio, [FromForm] string targetSinger, [FromForm] int? key)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });
        using var stream = audio.OpenReadStream();
        var bytes = await svc.RvcConvertAsync(stream, targetSinger, key);
        return File(bytes, "audio/wav", "converted.wav");
    }

    /// <summary>
    /// Generate music from a text prompt using AI.
    /// </summary>
    /// <param name="request">Generation request with prompt and duration</param>
    /// <returns>Generated WAV audio file</returns>
    [HttpPost("musicgen")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MusicGen([FromBody] MusicGenRequest request)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });
        var bytes = await svc.MusicGenAsync(request.Prompt, request.DurationSec);
        return File(bytes, "audio/wav", "generated.wav");
    }

    /// <summary>
    /// Detect pitch/frequency in audio file (CREPE model).
    /// </summary>
    [HttpPost("pitch")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> DetectPitch(IFormFile audio)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });

        var sw = System.Diagnostics.Stopwatch.StartNew();
        using var stream = audio.OpenReadStream();
        var result = await svc.DetectPitchAsync(stream);
        sw.Stop();

        if (result == null) return StatusCode(502, new { Message = "Pitch service unavailable" });

        return Ok(new
        {
            algorithm = "CREPE",
            latencyMs = sw.ElapsedMilliseconds,
            medianHz = result.MedianHz,
            noteName = result.NoteName,
            frameCount = result.FrequenciesHz.Length,
            track = result.TimestampsMs
                .Zip(result.FrequenciesHz, (t, hz) => new { t, hz }).ToArray()
        });
    }

    /// <summary>
    /// Detect rhythm/beats in audio file (BPM, beat times).
    /// </summary>
    [HttpPost("rhythm")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> DetectRhythm(IFormFile audio)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });
        using var stream = audio.OpenReadStream();
        var result = await svc.DetectRhythmAsync(stream);
        return result != null ? Ok(result) : StatusCode(502, new { Message = "Rhythm service unavailable" });
    }

    /// <summary>
    /// Detect voice activity segments in audio (VAD).
    /// </summary>
    [HttpPost("vad")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> DetectVoiceActivity(IFormFile audio)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });
        using var stream = audio.OpenReadStream();
        var result = await svc.DetectVoiceActivityAsync(stream);
        return result != null ? Ok(result) : StatusCode(502, new { Message = "VAD service unavailable" });
    }

    /// <summary>
    /// Detect audio tags/genres using PANNs model.
    /// </summary>
    [HttpPost("tags")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> DetectTags(IFormFile audio)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });
        using var stream = audio.OpenReadStream();
        var result = await svc.DetectTagsAsync(stream);
        return result != null ? Ok(result) : StatusCode(502, new { Message = "Tags service unavailable" });
    }

    /// <summary>
    /// Score singing quality by comparing vocal recording with a reference (DTW-based).
    /// </summary>
    /// <param name="vocal">Vocal audio file to evaluate</param>
    /// <param name="reference">Reference audio file for comparison</param>
    /// <returns>Score with pitch and rhythm accuracy</returns>
    [HttpPost("score")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> ScoreSinging(IFormFile vocal, IFormFile reference)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });

        if (vocal is not { Length: > 0 }) return BadRequest(new { Message = "Vocal file required." });
        if (reference is not { Length: > 0 }) return BadRequest(new { Message = "Reference file required." });

        var sw = System.Diagnostics.Stopwatch.StartNew();
        using var vs = vocal.OpenReadStream();
        using var rs = reference.OpenReadStream();
        var result = await svc.ScoreSingingAsync(vs, rs);
        sw.Stop();

        if (result == null) return StatusCode(502, new { Message = "Scoring service unavailable" });

        return Ok(new
        {
            latencyMs = sw.ElapsedMilliseconds,
            result.Score,
            result.PitchAccuracy,
            result.RhythmAccuracy,
        });
    }

    /// <summary>
    /// Generate audio using WaveGAN.
    /// </summary>
    [HttpPost("wavegan")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> WaveGan([FromBody] MusicGenRequest request)
    {
        var svc = HttpContext.RequestServices.GetService<IAiAudioService>();
        if (svc == null) return BadRequest(new { Message = "AI Audio service not configured" });
        var bytes = await svc.GenerateWaveGanAsync(request.Prompt);
        return File(bytes, "audio/wav", "wavegan.wav");
    }

    // ═══════════════════════════════════════════════════════════════════
    //  WebSocket proxy → audio_pitch Python service
    // ═══════════════════════════════════════════════════════════════════

    /// <summary>
    /// WebSocket proxy for real-time server-side CREPE pitch detection.
    /// Client sends binary PCM s16le 16kHz mono frames → server returns JSON {hz, confidence}.
    /// </summary>
    [Route("pitch/ws/pitch_server")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task PitchWsServer()
    {
        await ProxyWebSocket("pitch_server");
    }

    /// <summary>
    /// WebSocket proxy for client-side pitch smoothing.
    /// Client sends JSON {hz, confidence} → server returns smoothed values.
    /// </summary>
    [Route("pitch/ws/pitch_client")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task PitchWsClient()
    {
        await ProxyWebSocket("pitch_client");
    }

    private async Task ProxyWebSocket(string endpoint)
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            HttpContext.Response.StatusCode = 400;
            return;
        }

        var opts = HttpContext.RequestServices.GetService<Microsoft.Extensions.Options.IOptions<AiAudioOptions>>()?.Value;
        if (string.IsNullOrEmpty(opts?.PitchBaseUrl))
        {
            HttpContext.Response.StatusCode = 502;
            return;
        }

        var backendUri = new Uri(opts.PitchBaseUrl.Replace("https://", "wss://").Replace("http://", "ws://"));
        var targetUri = new Uri(backendUri, $"/ws/{endpoint}");

        using var clientWs = await HttpContext.WebSockets.AcceptWebSocketAsync();
        using var backendWs = new ClientWebSocket();

        try
        {
            await backendWs.ConnectAsync(targetUri, HttpContext.RequestAborted);
        }
        catch
        {
            await clientWs.CloseAsync(WebSocketCloseStatus.EndpointUnavailable,
                "Backend pitch service unavailable", CancellationToken.None);
            return;
        }

        var cts = CancellationTokenSource.CreateLinkedTokenSource(HttpContext.RequestAborted);
        var ct = cts.Token;

        // Client → Backend (binary PCM frames)
        var upstream = Task.Run(async () =>
        {
            var buf = new byte[8192];
            try
            {
                while (!ct.IsCancellationRequested)
                {
                    var result = await clientWs.ReceiveAsync(buf, ct);
                    if (result.MessageType == WebSocketMessageType.Close) break;
                    await backendWs.SendAsync(
                        new ArraySegment<byte>(buf, 0, result.Count),
                        result.MessageType, result.EndOfMessage, ct);
                }
            }
            catch (OperationCanceledException) { }
            catch (WebSocketException) { }
            finally { await cts.CancelAsync(); }
        }, ct);

        // Backend → Client (JSON text responses)
        var downstream = Task.Run(async () =>
        {
            var buf = new byte[4096];
            try
            {
                while (!ct.IsCancellationRequested)
                {
                    var result = await backendWs.ReceiveAsync(buf, ct);
                    if (result.MessageType == WebSocketMessageType.Close) break;
                    await clientWs.SendAsync(
                        new ArraySegment<byte>(buf, 0, result.Count),
                        result.MessageType, result.EndOfMessage, ct);
                }
            }
            catch (OperationCanceledException) { }
            catch (WebSocketException) { }
            finally { await cts.CancelAsync(); }
        }, ct);

        await Task.WhenAny(upstream, downstream);
        await cts.CancelAsync();

        if (clientWs.State == WebSocketState.Open)
            await clientWs.CloseAsync(WebSocketCloseStatus.NormalClosure, null, CancellationToken.None);
        if (backendWs.State == WebSocketState.Open)
            await backendWs.CloseAsync(WebSocketCloseStatus.NormalClosure, null, CancellationToken.None);
    }
}

