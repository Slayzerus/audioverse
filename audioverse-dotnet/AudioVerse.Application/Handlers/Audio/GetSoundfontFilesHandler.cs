using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class GetSoundfontFilesHandler(ISoundfontRepository repo) : IRequestHandler<GetSoundfontFilesQuery, IEnumerable<SoundfontFile>>
{
    public async Task<IEnumerable<SoundfontFile>> Handle(GetSoundfontFilesQuery req, CancellationToken ct)
    {
        return await repo.GetSoundfontFilesAsync(req.SoundfontId, ct);
    }
}
