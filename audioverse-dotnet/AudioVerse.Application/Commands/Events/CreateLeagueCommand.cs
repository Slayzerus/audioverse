using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Create a new league.</summary>
public record CreateLeagueCommand(League League) : IRequest<int>;
