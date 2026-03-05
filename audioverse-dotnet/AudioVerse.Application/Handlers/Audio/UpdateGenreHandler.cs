using AudioVerse.Application.Commands.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class UpdateGenreHandler : IRequestHandler<UpdateGenreCommand, bool>
    {
        private readonly IMusicGenreRepository _repo;
        public UpdateGenreHandler(IMusicGenreRepository repo) => _repo = repo;
        public async Task<bool> Handle(UpdateGenreCommand request, CancellationToken ct) => await _repo.UpdateAsync(request.Genre);
    }
}
