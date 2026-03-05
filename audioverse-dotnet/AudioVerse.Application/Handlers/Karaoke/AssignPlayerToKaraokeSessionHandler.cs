using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AssignPlayerToEventHandler : IRequestHandler<AssignPlayerToKaraokeSessionCommand, bool>
    {
        private readonly IKaraokeRepository _repository;

        public AssignPlayerToEventHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(AssignPlayerToKaraokeSessionCommand request, CancellationToken cancellationToken)
        {
            request.SessionPlayer.Status = KaraokePlayerStatus.Waiting;
            return await _repository.AssignPlayerToEventAsync(request.SessionPlayer);
        }
    }
}
