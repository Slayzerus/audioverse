using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class UploadSoundfontFilesHandler(ISoundfontRepository repo, IFileStorage storage) : IRequestHandler<UploadSoundfontFilesCommand, UploadSoundfontFilesResult?>
{
    private const string Bucket = "soundfonts";

    public async Task<UploadSoundfontFilesResult?> Handle(UploadSoundfontFilesCommand req, CancellationToken ct)
    {
        var sf = await repo.GetSoundfontByIdAsync(req.SoundfontId, ct);
        if (sf == null) return null;

        await storage.EnsureBucketExistsAsync(Bucket);

        var uploaded = new List<UploadedFileInfo>();

        foreach (var file in req.Files)
        {
            var key = $"{req.SoundfontId}/{Guid.NewGuid():N}_{file.FileName}";

            using var stream = file.Stream;

            string sha256;
            using (var sha = System.Security.Cryptography.SHA256.Create())
            {
                var hash = await sha.ComputeHashAsync(stream, ct);
                sha256 = Convert.ToHexStringLower(hash);
            }
            stream.Position = 0;

            await storage.UploadAsync(Bucket, key, stream, file.ContentType);

            var sfFile = new SoundfontFile
            {
                SoundfontId = req.SoundfontId,
                FileName = file.FileName,
                StorageKey = key,
                ContentType = file.ContentType,
                SizeBytes = file.SizeBytes,
                FileType = req.FileType,
                Sha256 = sha256
            };

            await repo.AddSoundfontFileAsync(sfFile, ct);
            sf.TotalSizeBytes += file.SizeBytes;

            uploaded.Add(new UploadedFileInfo(sfFile.Id, sfFile.FileName, sfFile.StorageKey, sfFile.SizeBytes, sfFile.Sha256));
        }

        sf.UpdatedAt = DateTime.UtcNow;
        await repo.SaveChangesAsync(ct);

        return new UploadSoundfontFilesResult(req.SoundfontId, uploaded.Count, uploaded);
    }
}

/// <summary>Handles querying soundfont files by soundfont ID.</summary>
