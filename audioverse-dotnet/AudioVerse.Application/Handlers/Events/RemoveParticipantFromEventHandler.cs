using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Events
{
    public class RemoveParticipantFromEventHandler : IRequestHandler<RemoveParticipantFromEventCommand, bool>
    {
        private readonly IEventRepository _repo;
        public RemoveParticipantFromEventHandler(IEventRepository repo) { _repo = repo; }
        public async Task<bool> Handle(RemoveParticipantFromEventCommand request, CancellationToken cancellationToken)
        {
            return await _repo.RemoveParticipantAsync(request.EventId, request.UserId, cancellationToken);
        }
    }
}
