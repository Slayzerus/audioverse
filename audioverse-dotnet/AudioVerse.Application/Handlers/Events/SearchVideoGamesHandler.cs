using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class SearchVideoGamesHandler(IEventRepository r) : IRequestHandler<SearchVideoGamesQuery, IEnumerable<Domain.Entities.Games.VideoGame>>
{
    public Task<IEnumerable<Domain.Entities.Games.VideoGame>> Handle(SearchVideoGamesQuery req, CancellationToken ct)
        => r.SearchVideoGamesAsync(req.Query, req.Limit);
}
