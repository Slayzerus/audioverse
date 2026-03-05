using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AddKaraokeSessionHandler : IRequestHandler<AddKaraokeSessionCommand, int>
    {
        private readonly IKaraokeRepository _repo;
        public AddKaraokeSessionHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<int> Handle(AddKaraokeSessionCommand request, CancellationToken cancellationToken)
        {
            return await _repo.AddSessionAsync(request.Session);
        }
    }
}
