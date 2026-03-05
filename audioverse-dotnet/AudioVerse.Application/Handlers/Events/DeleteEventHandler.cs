using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Events
{
    public class DeleteEventHandler : IRequestHandler<DeleteEventCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public DeleteEventHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<bool> Handle(DeleteEventCommand request, CancellationToken cancellationToken)
        {
            return await _repo.DeleteEventAsync(request.EventId);
        }
    }
}
