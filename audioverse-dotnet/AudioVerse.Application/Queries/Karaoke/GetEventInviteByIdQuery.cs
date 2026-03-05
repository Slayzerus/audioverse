using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Karaoke;

public record GetEventInviteByIdQuery(int InviteId) : IRequest<EventInvite?>;
