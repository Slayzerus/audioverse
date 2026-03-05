using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class SetSongsVerifiedHandler : IRequestHandler<SetSongsVerifiedCommand, bool>
    {
        private readonly IKaraokeRepository _karaokeRepository;

        public SetSongsVerifiedHandler(IKaraokeRepository karaokeRepository)
        {
            _karaokeRepository = karaokeRepository;
        }

        public async Task<bool> Handle(SetSongsVerifiedCommand request, CancellationToken cancellationToken)
        {
            return await _karaokeRepository.SetSongsVerifiedAsync(request.SongIds, request.IsVerified);
        }
    }
}
