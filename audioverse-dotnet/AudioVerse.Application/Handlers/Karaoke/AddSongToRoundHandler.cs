using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Commands.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AddSongToRoundHandler : IRequestHandler<AddSongToRoundCommand, int>
    {
        private readonly IKaraokeRepository _repository;

        public AddSongToRoundHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(AddSongToRoundCommand request, CancellationToken cancellationToken)
        {
            return await _repository.AddSongToRoundAsync(request.Singing);
        }
    }
}
