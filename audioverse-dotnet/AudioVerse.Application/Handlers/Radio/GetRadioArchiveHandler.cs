using AudioVerse.Application.Queries.Radio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Radio;

/// <summary>Handles retrieving the station day archive (voice segments + tracks).</summary>
public class GetRadioArchiveHandler(IRadioRepository radio, IFileStorage storage) : IRequestHandler<GetRadioArchiveQuery, IEnumerable<ArchiveEntryDto>>
{
    public async Task<IEnumerable<ArchiveEntryDto>> Handle(GetRadioArchiveQuery req, CancellationToken ct)
    {
        var dayStart = req.Date.Date;
        var dayEnd = dayStart.AddDays(1);

        var segments = await radio.GetVoiceSegmentsForDayAsync(req.RadioStationId, dayStart, dayEnd, ct);

        var entries = new List<ArchiveEntryDto>();
        foreach (var seg in segments)
        {
            string? audioUrl = null;
            try { audioUrl = await storage.GetPresignedUrlAsync("audio", seg.StorageKey, TimeSpan.FromHours(1)); }
            catch { }

            entries.Add(new ArchiveEntryDto(
                Type: "voice",
                TimestampUtc: seg.TimestampUtc,
                DurationMs: seg.DurationMs,
                TrackId: seg.BackgroundTrackId,
                TrackTitle: null,
                VoiceSegmentId: seg.Id,
                DjComment: seg.DjComment,
                AudioUrl: audioUrl));
        }
        return entries;
    }
}
