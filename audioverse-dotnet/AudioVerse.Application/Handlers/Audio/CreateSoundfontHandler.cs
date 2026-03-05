using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class CreateSoundfontHandler(ISoundfontRepository repo) : IRequestHandler<CreateSoundfontCommand, int>
{
    public async Task<int> Handle(CreateSoundfontCommand req, CancellationToken ct)
    {
        return await repo.AddSoundfontAsync(req.Soundfont, ct);
    }
}

/// <summary>Handles updating soundfont metadata.</summary>
