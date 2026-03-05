using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Events
{
    public class UpdateEventHandler : IRequestHandler<UpdateEventCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public UpdateEventHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<bool> Handle(UpdateEventCommand request, CancellationToken cancellationToken)
        {
            return await _repo.UpdateEventAsync(request.Event);
        }
    }
}
