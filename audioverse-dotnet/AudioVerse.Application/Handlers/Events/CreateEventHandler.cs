using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Events
{
    public class CreateEventHandler : IRequestHandler<CreateEventCommand, int>
    {
        private readonly IKaraokeRepository _repo;
        public CreateEventHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<int> Handle(CreateEventCommand request, CancellationToken cancellationToken)
        {
            return await _repo.CreateEventAsync(request.Event);
        }
    }
}
