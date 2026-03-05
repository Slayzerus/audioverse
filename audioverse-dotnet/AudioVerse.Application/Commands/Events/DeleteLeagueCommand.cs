using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Delete a league by ID.</summary>
public record DeleteLeagueCommand(int Id) : IRequest<bool>;
