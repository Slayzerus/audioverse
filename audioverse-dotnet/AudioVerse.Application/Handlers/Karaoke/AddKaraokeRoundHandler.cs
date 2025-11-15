using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Commands.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AddKaraokeRoundHandler : IRequestHandler<AddKaraokeRoundCommand, int>
    {
        private readonly IKaraokeRepository _repository;

        public AddKaraokeRoundHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(AddKaraokeRoundCommand request, CancellationToken cancellationToken)
        {
            return await _repository.AddRoundAsync(request.Round);
        }
    }
}
