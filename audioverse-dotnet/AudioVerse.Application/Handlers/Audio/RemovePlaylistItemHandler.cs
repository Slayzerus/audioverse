using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class RemovePlaylistItemHandler : IRequestHandler<RemovePlaylistItemCommand, bool>
    {
        private readonly IPlaylistRepository _repo;
        public RemovePlaylistItemHandler(IPlaylistRepository repo) => _repo = repo;
        public async Task<bool> Handle(RemovePlaylistItemCommand request, CancellationToken ct) => await _repo.RemoveItemAsync(request.Id);
    }
}
