using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AddCollaboratorHandler : IRequestHandler<AddCollaboratorCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public AddCollaboratorHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<bool> Handle(AddCollaboratorCommand request, CancellationToken cancellationToken)
            => await _repo.AddCollaboratorAsync(request.SongId, request.UserId, request.Permission);
    }
}
