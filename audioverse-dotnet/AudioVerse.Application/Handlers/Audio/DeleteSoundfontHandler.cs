using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class DeleteSoundfontHandler(ISoundfontRepository repo, IFileStorage storage) : IRequestHandler<DeleteSoundfontCommand, bool>
{
    private const string Bucket = "soundfonts";

    public async Task<bool> Handle(DeleteSoundfontCommand req, CancellationToken ct)
    {
        var sf = await repo.GetSoundfontWithFilesAsync(req.Id, ct);
        if (sf == null) return false;

        foreach (var file in sf.Files)
        {
            try { await storage.DeleteAsync(Bucket, file.StorageKey, ct); }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException) { /* log but don't fail */ }
        }

        await repo.RemoveSoundfontAsync(sf, ct);
        return true;
    }
}

/// <summary>Handles deleting a single soundfont file from storage.</summary>
