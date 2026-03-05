using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Queries.Social;

/// <summary>Get tag cloud for an entity (tag + count).</summary>
public record GetTagCloudQuery(RateableEntityType EntityType, int EntityId) : IRequest<List<TagCloudEntry>>;
