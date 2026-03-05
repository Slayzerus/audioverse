using AudioVerse.Application.Queries.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles retrieving comments for an entity.</summary>
public class GetCommentsHandler(ISocialRepository socialRepository)
    : IRequestHandler<GetCommentsQuery, GetCommentsResult>
{
    public async Task<GetCommentsResult> Handle(GetCommentsQuery request, CancellationToken cancellationToken)
    {
        var (items, total) = await socialRepository.GetCommentsAsync(
            request.EntityType, request.EntityId, request.Page, request.PageSize);
        return new GetCommentsResult(items, total);
    }
}
