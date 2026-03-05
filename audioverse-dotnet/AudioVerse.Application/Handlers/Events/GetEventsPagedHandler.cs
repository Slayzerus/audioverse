using AudioVerse.Application.Models.Common;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventsPagedHandler(IEventRepository repo) : IRequestHandler<GetEventsPagedQuery, PagedResult<Event>>
{
    public async Task<PagedResult<Event>> Handle(GetEventsPagedQuery request, CancellationToken ct)
    {
        var f = request.Filter;
        var (items, total) = await repo.GetEventsPagedAsync(
            f.Query, f.OrganizerIds, f.Types, f.Statuses, f.Visibilities,
            f.StartFrom, f.StartTo,
            f.Page, f.PageSize, f.SortBy, f.Descending);

        return new PagedResult<Event>
        {
            Items = items,
            TotalCount = total,
            Page = f.Page,
            PageSize = f.PageSize
        };
    }
}
