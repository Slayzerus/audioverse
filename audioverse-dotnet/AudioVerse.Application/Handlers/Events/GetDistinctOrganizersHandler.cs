using AudioVerse.Application.Models.Dtos;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetDistinctOrganizersHandler(IEventRepository repo)
    : IRequestHandler<GetDistinctOrganizersQuery, IEnumerable<EventOrganizerDto>>
{
    public async Task<IEnumerable<EventOrganizerDto>> Handle(GetDistinctOrganizersQuery request, CancellationToken ct)
    {
        var organizers = await repo.GetDistinctOrganizersAsync();
        return organizers.Select(o => new EventOrganizerDto(o.Id, o.Name));
    }
}
