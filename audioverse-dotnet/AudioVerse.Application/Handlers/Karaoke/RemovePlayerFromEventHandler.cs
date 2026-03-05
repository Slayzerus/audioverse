using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class RemovePlayerFromEventHandler : IRequestHandler<RemovePlayerFromKaraokeSessionCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public RemovePlayerFromEventHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<bool> Handle(RemovePlayerFromKaraokeSessionCommand request, CancellationToken cancellationToken)
        {
            return await _repo.RemovePlayerFromEventAsync(request.SessionId, request.PlayerId);
        }
    }
}
