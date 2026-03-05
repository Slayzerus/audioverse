using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Create a fantasy team in a fantasy league.</summary>
public record CreateFantasyTeamCommand(FantasyTeam Team) : IRequest<int>;
