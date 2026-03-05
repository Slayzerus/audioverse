using AudioVerse.Domain.Entities.Radio;
using MediatR;

namespace AudioVerse.Application.Commands.Radio;

/// <summary>Start a live voice session on a radio station.</summary>
public record StartVoiceSessionCommand(int RadioStationId, int SpeakerUserId, bool EnableRecording = false) : IRequest<VoiceSession>;
