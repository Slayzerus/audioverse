using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Add a participant to a league.</summary>
public record AddLeagueParticipantCommand(LeagueParticipant Participant) : IRequest<int>;
