using AudioVerse.Application.Queries.Social;
using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles retrieving a player's personal list entries.</summary>
public class GetPlayerListHandler(ISocialRepository socialRepository)
    : IRequestHandler<GetPlayerListQuery, IEnumerable<UserListEntry>>
{
    public async Task<IEnumerable<UserListEntry>> Handle(GetPlayerListQuery request, CancellationToken cancellationToken)
    {
        return await socialRepository.GetPlayerListAsync(request.PlayerId, request.ListName, request.EntityType);
    }
}
