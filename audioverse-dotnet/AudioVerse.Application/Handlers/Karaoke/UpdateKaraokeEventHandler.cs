using MediatR;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class UpdateKaraokeEventHandler : IRequestHandler<Commands.Karaoke.UpdateKaraokeEventCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public UpdateKaraokeEventHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<bool> Handle(Commands.Karaoke.UpdateKaraokeEventCommand request, CancellationToken cancellationToken)
        {
            return await _repo.UpdateEventAsync(request.Event);
        }
    }
}
