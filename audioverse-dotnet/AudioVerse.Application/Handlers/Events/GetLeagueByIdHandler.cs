using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles retrieving a league by ID.</summary>
public class GetLeagueByIdHandler(ILeagueRepository repo) : IRequestHandler<GetLeagueByIdQuery, League?>
{
    public Task<League?> Handle(GetLeagueByIdQuery req, CancellationToken ct) =>
        repo.GetLeagueByIdAsync(req.Id);
}
