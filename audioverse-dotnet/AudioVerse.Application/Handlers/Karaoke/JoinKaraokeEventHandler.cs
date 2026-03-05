using MediatR;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class JoinKaraokeEventHandler : IRequestHandler<Commands.Karaoke.JoinKaraokeSessionCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public JoinKaraokeEventHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<bool> Handle(Commands.Karaoke.JoinKaraokeSessionCommand request, CancellationToken cancellationToken)
        {
            var ev = await _repo.GetEventByIdAsync(request.SessionId);
            if (ev == null) return false;

            // Public access or admin always allowed
            if (ev.Access == Domain.Enums.EventAccessType.Public)
                return true;

            // Code access
            if (ev.Access == Domain.Enums.EventAccessType.Code)
            {
                if (string.IsNullOrEmpty(request.Code)) return false;
                var valid = ev.CodeHash == request.Code
                    || ev.CodeHash == Infrastructure.Helpers.HashHelper.Sha256(request.Code);
                return valid;
            }

            // Link access - allowed if they got to this point
            if (ev.Access == Domain.Enums.EventAccessType.Link)
                return true;

            return false;
        }
    }
}
