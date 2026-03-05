using MediatR;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Events
{
    public class GetParticipantsByEventHandler : IRequestHandler<GetParticipantsByEventQuery, IEnumerable<EventParticipant>>
    {
        private readonly IEventRepository _repo;
        public GetParticipantsByEventHandler(IEventRepository repo) => _repo = repo;

        public async Task<IEnumerable<EventParticipant>> Handle(GetParticipantsByEventQuery request, CancellationToken cancellationToken)
        {
            return await _repo.GetParticipantsByEventAsync(request.EventId, cancellationToken);
        }
    }
}
