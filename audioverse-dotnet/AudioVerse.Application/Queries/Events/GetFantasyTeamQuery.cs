using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get a fantasy team by ID with its players.</summary>
public record GetFantasyTeamQuery(int Id) : IRequest<FantasyTeam?>;
