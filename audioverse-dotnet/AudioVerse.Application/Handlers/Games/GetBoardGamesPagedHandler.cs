using AudioVerse.Application.Models.Common;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetBoardGamesPagedHandler(IGameRepository r) : IRequestHandler<GetBoardGamesPagedQuery, PagedResult<BoardGame>>
{
    public async Task<PagedResult<BoardGame>> Handle(GetBoardGamesPagedQuery request, CancellationToken ct)
    {
        var f = request.Filter;
        var (items, total) = await r.GetBoardGamesPagedAsync(
            f.Query, f.MinPlayers, f.MaxPlayers,
            f.Page, f.PageSize, f.SortBy, f.Descending);
        return new PagedResult<BoardGame> { Items = items, TotalCount = total, Page = f.Page, PageSize = f.PageSize };
    }
}
