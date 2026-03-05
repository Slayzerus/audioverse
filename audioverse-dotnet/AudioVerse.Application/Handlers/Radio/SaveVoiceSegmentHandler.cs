using AudioVerse.Application.Commands.Radio;
using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Radio;

/// <summary>Handles saving a voice segment to storage and DB.</summary>
public class SaveVoiceSegmentHandler(IRadioRepository radio, IFileStorage storage) : IRequestHandler<SaveVoiceSegmentCommand, VoiceSegment>
{
    public async Task<VoiceSegment> Handle(SaveVoiceSegmentCommand req, CancellationToken ct)
    {
        var storageKey = $"voice-archive/{req.VoiceSessionId}/{req.SegmentIndex}.webm";
        using var stream = new MemoryStream(req.AudioData);
        await storage.UploadAsync("audio", storageKey, stream, "audio/webm");

        var segment = new VoiceSegment
        {
            VoiceSessionId = req.VoiceSessionId,
            SegmentIndex = req.SegmentIndex,
            StorageKey = storageKey,
            TimestampUtc = DateTime.UtcNow,
            DurationMs = req.DurationMs,
            BackgroundTrackId = req.BackgroundTrackId,
            DjComment = req.DjComment
        };

        var session = await radio.GetVoiceSessionByIdAsync(req.VoiceSessionId, ct);
        if (session != null) session.SegmentCount = req.SegmentIndex + 1;

        await radio.AddVoiceSegmentAsync(segment, ct);
        return segment;
    }
}
