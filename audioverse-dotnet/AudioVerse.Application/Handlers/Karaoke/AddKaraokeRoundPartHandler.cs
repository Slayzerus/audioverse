using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AddKaraokeRoundPartHandler : IRequestHandler<AddKaraokeRoundPartCommand, int>
    {
        private readonly IKaraokeRepository _repo;
        public AddKaraokeRoundPartHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<int> Handle(AddKaraokeRoundPartCommand request, CancellationToken cancellationToken)
        {
            return await _repo.AddRoundPartAsync(request.Part);
        }
    }
}
