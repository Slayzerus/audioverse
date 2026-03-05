using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetVideoTagsQuery(int VideoId) : IRequest<IEnumerable<EventMediaTag>>;
