using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetEventByIdHandler : IRequestHandler<GetEventByIdQuery, Event?>
    {
        private readonly IKaraokeRepository _repo;
        public GetEventByIdHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<Event?> Handle(GetEventByIdQuery request, CancellationToken cancellationToken)
        {
            return await _repo.GetEventByIdAsync(request.EventId);
        }
    }
}
