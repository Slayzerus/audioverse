using MediatR;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Handlers.Events
{
    public class GetEventByIdHandler : IRequestHandler<GetEventByIdQuery, Event?>
    {
        private readonly IKaraokeRepository _repo;
        public GetEventByIdHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<Event?> Handle(GetEventByIdQuery request, CancellationToken cancellationToken)
        {
            return await _repo.GetEventByIdAsync(request.EventId);
        }
    }
}
