using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Email;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class GetEventInviteByIdHandler(IKaraokeRepository repo) : IRequestHandler<GetEventInviteByIdQuery, EventInvite?>
{
    public Task<EventInvite?> Handle(GetEventInviteByIdQuery req, CancellationToken ct)
        => repo.GetEventInviteByIdAsync(req.InviteId);
}
