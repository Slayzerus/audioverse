using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class DeleteSoundfontFileHandler(ISoundfontRepository repo, IFileStorage storage) : IRequestHandler<DeleteSoundfontFileCommand, bool>
{
    private const string Bucket = "soundfonts";

    public async Task<bool> Handle(DeleteSoundfontFileCommand req, CancellationToken ct)
    {
        var file = await repo.GetSoundfontFileByIdAsync(req.FileId, ct);
        if (file == null) return false;

        try { await storage.DeleteAsync(Bucket, file.StorageKey, ct); }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException) { /* log but don't fail */ }

        // Update parent total size
        var parent = await repo.GetSoundfontByIdAsync(file.SoundfontId, ct);
        if (parent != null)
        {
            parent.TotalSizeBytes -= file.SizeBytes;
            if (parent.TotalSizeBytes < 0) parent.TotalSizeBytes = 0;
        }

        await repo.RemoveSoundfontFileAsync(file, ct);
        await repo.SaveChangesAsync(ct);
        return true;
    }
}

/// <summary>Handles querying soundfonts with paging and filtering.</summary>
