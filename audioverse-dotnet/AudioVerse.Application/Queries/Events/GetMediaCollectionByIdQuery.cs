using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetMediaCollectionByIdQuery(int Id) : IRequest<EventMediaCollection?>;
