using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Draft a player to a fantasy team.</summary>
public record DraftFantasyPlayerCommand(FantasyTeamPlayer Player) : IRequest<int>;
