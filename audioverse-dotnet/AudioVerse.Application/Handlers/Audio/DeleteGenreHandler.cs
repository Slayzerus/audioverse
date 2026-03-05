using AudioVerse.Application.Commands.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class DeleteGenreHandler : IRequestHandler<DeleteGenreCommand, bool>
    {
        private readonly IMusicGenreRepository _repo;
        public DeleteGenreHandler(IMusicGenreRepository repo) => _repo = repo;
        public async Task<bool> Handle(DeleteGenreCommand request, CancellationToken ct) => await _repo.DeleteAsync(request.Id);
    }
}
