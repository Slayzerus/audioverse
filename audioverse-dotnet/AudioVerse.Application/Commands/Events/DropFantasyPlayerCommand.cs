using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Drop (release) a player from a fantasy team.</summary>
public record DropFantasyPlayerCommand(int PlayerId) : IRequest<bool>;
