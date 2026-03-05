using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class SetSongInDevelopmentHandler : IRequestHandler<SetSongInDevelopmentCommand, bool>
    {
        private readonly IKaraokeRepository _karaokeRepository;

        public SetSongInDevelopmentHandler(IKaraokeRepository karaokeRepository)
        {
            _karaokeRepository = karaokeRepository;
        }

        public async Task<bool> Handle(SetSongInDevelopmentCommand request, CancellationToken cancellationToken)
        {
            return await _karaokeRepository.SetSongInDevelopmentAsync(request.SongId, request.InDevelopment);
        }
    }
}
