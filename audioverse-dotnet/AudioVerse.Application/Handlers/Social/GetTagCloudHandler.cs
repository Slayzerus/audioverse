using AudioVerse.Application.Queries.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles retrieving tag cloud for an entity.</summary>
public class GetTagCloudHandler(ISocialRepository socialRepository)
    : IRequestHandler<GetTagCloudQuery, List<TagCloudEntry>>
{
    public async Task<List<TagCloudEntry>> Handle(GetTagCloudQuery request, CancellationToken cancellationToken)
    {
        var rows = await socialRepository.GetTagCloudAsync(request.EntityType, request.EntityId);
        return rows.Select(r => new TagCloudEntry(r.Tag, r.Count)).ToList();
    }
}
