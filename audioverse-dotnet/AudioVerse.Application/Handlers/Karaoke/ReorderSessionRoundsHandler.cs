using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class ReorderSessionRoundsHandler : IRequestHandler<ReorderSessionRoundsCommand, bool>
    {
        private readonly IEfKaraokeRepository _repo;
        public ReorderSessionRoundsHandler(IEfKaraokeRepository repo) => _repo = repo;

        public async Task<bool> Handle(ReorderSessionRoundsCommand request, CancellationToken cancellationToken)
        {
            return await _repo.ReorderSessionRoundsAsync(request.SessionId, request.RoundIds);
        }
    }
}
