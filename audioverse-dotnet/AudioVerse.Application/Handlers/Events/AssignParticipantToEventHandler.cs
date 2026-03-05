using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Events
{
    public class AssignParticipantToEventHandler : IRequestHandler<AssignParticipantToEventCommand, bool>
    {
        private readonly IEventRepository _repo;
        public AssignParticipantToEventHandler(IEventRepository repo) { _repo = repo; }
        public async Task<bool> Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken)
        {
            var existing = await _repo.GetParticipantAsync(request.EventId, request.UserId, cancellationToken);
            if (existing != null) return true;

            var participant = new EventParticipant
            {
                EventId = request.EventId,
                UserId = request.UserId,
                Status = EventParticipantStatus.Registered
            };

            await _repo.AddParticipantAsync(participant, cancellationToken);
            return true;
        }
    }
}
