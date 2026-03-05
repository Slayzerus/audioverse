using AudioVerse.Application.Models.Common;
using AudioVerse.Application.Models.Requests.Events;
using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetEventsPagedQuery(EventFilterRequest Filter) : IRequest<PagedResult<Event>>;
