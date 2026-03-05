using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class CreateKaraokeSessionHandler : IRequestHandler<CreateKaraokeSessionCommand, int>
    {
        private readonly IKaraokeRepository _repo;
        public CreateKaraokeSessionHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<int> Handle(CreateKaraokeSessionCommand request, CancellationToken cancellationToken)
        {
            return await _repo.AddSessionAsync(request.Session);
        }
    }
}
