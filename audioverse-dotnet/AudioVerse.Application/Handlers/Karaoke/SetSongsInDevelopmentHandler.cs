using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class SetSongsInDevelopmentHandler : IRequestHandler<SetSongsInDevelopmentCommand, bool>
    {
        private readonly IKaraokeRepository _karaokeRepository;

        public SetSongsInDevelopmentHandler(IKaraokeRepository karaokeRepository)
        {
            _karaokeRepository = karaokeRepository;
        }

        public async Task<bool> Handle(SetSongsInDevelopmentCommand request, CancellationToken cancellationToken)
        {
            return await _karaokeRepository.SetSongsInDevelopmentAsync(request.SongIds, request.InDevelopment);
        }
    }
}
