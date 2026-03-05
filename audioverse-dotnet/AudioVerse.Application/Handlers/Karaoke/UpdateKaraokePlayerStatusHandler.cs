using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class UpdateKaraokePlayerStatusHandler : IRequestHandler<UpdateKaraokePlayerStatusCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public UpdateKaraokePlayerStatusHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<bool> Handle(UpdateKaraokePlayerStatusCommand request, CancellationToken cancellationToken)
        {
            return await _repo.UpdateKaraokePlayerStatusAsync(request.EventId, request.PlayerId, request.Status);
        }
    }
}
