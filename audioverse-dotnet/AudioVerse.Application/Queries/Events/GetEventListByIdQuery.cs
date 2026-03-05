using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetEventListByIdQuery(int Id) : IRequest<EventList?>;
