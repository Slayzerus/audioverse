using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class AddPlaylistItemHandler : IRequestHandler<AddPlaylistItemCommand, int>
    {
        private readonly IPlaylistRepository _repo;
        public AddPlaylistItemHandler(IPlaylistRepository repo) => _repo = repo;
        public async Task<int> Handle(AddPlaylistItemCommand request, CancellationToken ct) => await _repo.AddItemAsync(request.PlaylistId, request.SongId, request.OrderNumber);
    }
}
