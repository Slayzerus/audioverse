using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class GetCollaboratorsHandler(IKaraokeRepository repo) : IRequestHandler<GetCollaboratorsQuery, IEnumerable<int>>
{
    public Task<IEnumerable<int>> Handle(GetCollaboratorsQuery req, CancellationToken ct)
        => repo.GetCollaboratorUserIdsAsync(req.SongId);
}
