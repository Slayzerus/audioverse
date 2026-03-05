using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetAllSongsHandler : IRequestHandler<GetAllSongsQuery, IEnumerable<KaraokeSongFile>>
    {
        private readonly IKaraokeRepository _repository;
        private readonly AudioVerse.Application.Services.ICurrentUserService _currentUser;

        public GetAllSongsHandler(IKaraokeRepository repository, AudioVerse.Application.Services.ICurrentUserService currentUser)
        {
            _repository = repository;
            _currentUser = currentUser;
        }

        public async Task<IEnumerable<KaraokeSongFile>> Handle(GetAllSongsQuery request, CancellationToken cancellationToken)
        {
            int? userId = _currentUser.IsAdmin ? null : _currentUser.UserId;
            return await _repository.GetAvailableSongsForUserAsync(userId, request.IncludeInDevelopment);
        }
    }
}
