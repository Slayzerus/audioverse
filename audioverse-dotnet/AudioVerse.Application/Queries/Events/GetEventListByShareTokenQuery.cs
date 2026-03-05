using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetEventListByShareTokenQuery(string ShareToken) : IRequest<EventList?>;
