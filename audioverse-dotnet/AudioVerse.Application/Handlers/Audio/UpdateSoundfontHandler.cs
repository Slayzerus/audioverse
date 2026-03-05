using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class UpdateSoundfontHandler(ISoundfontRepository repo) : IRequestHandler<UpdateSoundfontCommand, bool>
{
    public async Task<bool> Handle(UpdateSoundfontCommand req, CancellationToken ct)
    {
        var existing = await repo.GetSoundfontByIdAsync(req.Soundfont.Id, ct);
        if (existing == null) return false;

        existing.Name = req.Soundfont.Name;
        existing.Description = req.Soundfont.Description;
        existing.Format = req.Soundfont.Format;
        existing.Author = req.Soundfont.Author;
        existing.Version = req.Soundfont.Version;
        existing.License = req.Soundfont.License;
        existing.PresetCount = req.Soundfont.PresetCount;
        existing.Tags = req.Soundfont.Tags;
        existing.UpdatedAt = DateTime.UtcNow;

        await repo.SaveChangesAsync(ct);
        return true;
    }
}

/// <summary>Handles deleting a soundfont and all its files from storage.</summary>
