using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Update an existing league.</summary>
public record UpdateLeagueCommand(League League) : IRequest<bool>;
