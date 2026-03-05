using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetEventPhotoVersionsQuery(int PhotoId) : IRequest<IEnumerable<EventPhoto>>;
