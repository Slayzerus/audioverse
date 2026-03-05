using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class GetSoundfontsHandler(ISoundfontRepository repo) : IRequestHandler<GetSoundfontsQuery, IEnumerable<Soundfont>>
{
    public async Task<IEnumerable<Soundfont>> Handle(GetSoundfontsQuery req, CancellationToken ct)
    {
        return await repo.SearchSoundfontsAsync(req.Query, req.Format, req.Page, req.PageSize, ct);
    }
}

/// <summary>Handles getting a single soundfont by ID.</summary>
