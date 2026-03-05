using AudioVerse.Domain.Entities.Radio;
using MediatR;

namespace AudioVerse.Application.Commands.Radio;

/// <summary>Stop a live voice session.</summary>
public record StopVoiceSessionCommand(int RadioStationId, int SpeakerUserId) : IRequest<VoiceSession?>;
