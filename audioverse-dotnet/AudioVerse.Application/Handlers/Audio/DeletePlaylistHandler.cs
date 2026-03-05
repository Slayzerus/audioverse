using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class DeletePlaylistHandler : IRequestHandler<DeletePlaylistCommand, bool>
    {
        private readonly IPlaylistRepository _repo;
        public DeletePlaylistHandler(IPlaylistRepository repo) => _repo = repo;
        public async Task<bool> Handle(DeletePlaylistCommand request, CancellationToken ct) => await _repo.DeleteAsync(request.Id);
    }
}
