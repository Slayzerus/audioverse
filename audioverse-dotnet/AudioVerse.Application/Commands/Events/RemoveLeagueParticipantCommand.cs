using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Remove a participant from a league.</summary>
public record RemoveLeagueParticipantCommand(int Id) : IRequest<bool>;
