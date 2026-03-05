using MediatR;
using AudioVerse.Domain.Repositories;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetSongByIdHandler : IRequestHandler<GetSongByIdQuery, KaraokeSongFile?>
    {
        private readonly IKaraokeRepository _repository;

        public GetSongByIdHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<KaraokeSongFile?> Handle(GetSongByIdQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetSongByIdAsync(request.Id);
        }
    }
}
