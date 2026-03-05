using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Events
{
    public class AddSessionToEventHandler : IRequestHandler<AddSessionToEventCommand, int>
    {
        private readonly IKaraokeRepository _repo;
        public AddSessionToEventHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<int> Handle(AddSessionToEventCommand request, CancellationToken cancellationToken)
        {
            request.Session.EventId = request.EventId;
            return await _repo.AddSessionToEventAsync(request.Session);
        }
    }
}
