using MediatR;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Queries;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetEventWithPlayersHandler : IRequestHandler<GetEventWithPlayersQuery, Event?>
    {
        private readonly IKaraokeRepository _repository;

        public GetEventWithPlayersHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<Event?> Handle(GetEventWithPlayersQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetEventByIdAsync(request.EventId);
        }
    }
}
