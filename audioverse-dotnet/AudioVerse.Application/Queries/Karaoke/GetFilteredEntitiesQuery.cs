using MediatR;
using AudioVerse.Application.Models.Common;
using AudioVerse.Application.Models.Requests.Karaoke;

namespace AudioVerse.Application.Queries.Karaoke
{
    // Generic query for filtered entities (parties/songs) - entity mapping will be decided by handler
    public record GetFilteredEntitiesQuery(string EntityName, DynamicFilterRequest Filter) : IRequest<PagedResult<object>>;
}
