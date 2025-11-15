using MediatR;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Queries;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Queries.Karaoke;

namespace AudioVerse.Application.Handlers
{
    public class GetPlaylistWithSongsHandler : IRequestHandler<GetPlaylistWithSongsQuery, KaraokePlaylist?>
    {
        private readonly IKaraokeRepository _repository;

        public GetPlaylistWithSongsHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<KaraokePlaylist?> Handle(GetPlaylistWithSongsQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetPlaylistWithSongsAsync(request.PlaylistId);
        }
    }
}
