using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetEventByEventIdHandler : IRequestHandler<GetEventByEventIdQuery, Event?>
    {
        private readonly IKaraokeRepository _repo;
        public GetEventByEventIdHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<Event?> Handle(GetEventByEventIdQuery request, CancellationToken cancellationToken)
        {
            return await _repo.GetEventByEventIdAsync(request.EventId);
        }
    }
}
