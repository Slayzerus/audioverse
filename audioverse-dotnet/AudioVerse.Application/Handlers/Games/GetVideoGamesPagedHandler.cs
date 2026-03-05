using AudioVerse.Application.Models.Common;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetVideoGamesPagedHandler(IGameRepository r) : IRequestHandler<GetVideoGamesPagedQuery, PagedResult<VideoGame>>
{
    public async Task<PagedResult<VideoGame>> Handle(GetVideoGamesPagedQuery request, CancellationToken ct)
    {
        var f = request.Filter;
        var (items, total) = await r.GetVideoGamesPagedAsync(
            f.Query, f.MinPlayers, f.MaxPlayers,
            f.Page, f.PageSize, f.SortBy, f.Descending);
        return new PagedResult<VideoGame> { Items = items, TotalCount = total, Page = f.Page, PageSize = f.PageSize };
    }
}
