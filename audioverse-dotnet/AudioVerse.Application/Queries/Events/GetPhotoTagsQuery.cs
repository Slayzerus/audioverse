using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetPhotoTagsQuery(int PhotoId) : IRequest<IEnumerable<EventMediaTag>>;
