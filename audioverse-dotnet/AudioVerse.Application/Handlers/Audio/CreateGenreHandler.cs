using AudioVerse.Application.Commands.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class CreateGenreHandler : IRequestHandler<CreateGenreCommand, int>
    {
        private readonly IMusicGenreRepository _repo;
        public CreateGenreHandler(IMusicGenreRepository repo) => _repo = repo;
        public async Task<int> Handle(CreateGenreCommand request, CancellationToken ct) => await _repo.CreateAsync(request.Genre);
    }
}
