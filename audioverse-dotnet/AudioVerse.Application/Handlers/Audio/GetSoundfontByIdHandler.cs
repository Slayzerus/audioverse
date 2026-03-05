using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class GetSoundfontByIdHandler(ISoundfontRepository repo) : IRequestHandler<GetSoundfontByIdQuery, Soundfont?>
{
    public async Task<Soundfont?> Handle(GetSoundfontByIdQuery req, CancellationToken ct)
    {
        return await repo.GetSoundfontWithFilesAsync(req.Id, ct);
    }
}

/// <summary>Handles generating a presigned download URL for a soundfont file.</summary>
