using AudioVerse.Domain.Entities.Radio;
using MediatR;

namespace AudioVerse.Application.Commands.Radio;

/// <summary>Save a voice segment (audio chunk) to storage and DB.</summary>
public record SaveVoiceSegmentCommand(int VoiceSessionId, int SegmentIndex, byte[] AudioData, int DurationMs, int? BackgroundTrackId = null, string? DjComment = null) : IRequest<VoiceSegment>;
