using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class SetSongVerifiedHandler : IRequestHandler<SetSongVerifiedCommand, bool>
    {
        private readonly IKaraokeRepository _karaokeRepository;

        public SetSongVerifiedHandler(IKaraokeRepository karaokeRepository)
        {
            _karaokeRepository = karaokeRepository;
        }

        public async Task<bool> Handle(SetSongVerifiedCommand request, CancellationToken cancellationToken)
        {
            return await _karaokeRepository.SetSongVerifiedAsync(request.SongId, request.IsVerified);
        }
    }
}
