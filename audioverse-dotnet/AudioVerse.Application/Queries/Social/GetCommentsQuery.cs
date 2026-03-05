using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Queries.Social;

/// <summary>Get comments for an entity (threaded, paged).</summary>
public record GetCommentsQuery(
    RateableEntityType EntityType,
    int EntityId,
    int Page,
    int PageSize
) : IRequest<GetCommentsResult>;
