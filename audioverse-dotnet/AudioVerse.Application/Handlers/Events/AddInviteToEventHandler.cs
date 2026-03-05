using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Events
{
    public class AddInviteToEventHandler : IRequestHandler<AddInviteToEventCommand, int>
    {
        private readonly IKaraokeRepository _repo;
        public AddInviteToEventHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<int> Handle(AddInviteToEventCommand request, CancellationToken cancellationToken)
        {
            request.Invite.EventId = request.EventId;
            return await _repo.AddInviteToEventAsync(request.Invite);
        }
    }
}
