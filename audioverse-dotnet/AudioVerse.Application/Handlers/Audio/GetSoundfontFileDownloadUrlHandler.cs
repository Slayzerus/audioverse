using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio;

public class GetSoundfontFileDownloadUrlHandler(ISoundfontRepository repo, IFileStorage storage) : IRequestHandler<GetSoundfontFileDownloadUrlQuery, string?>
{
    private const string Bucket = "soundfonts";

    public async Task<string?> Handle(GetSoundfontFileDownloadUrlQuery req, CancellationToken ct)
    {
        var file = await repo.GetSoundfontFileByIdAsync(req.FileId, ct);
        if (file == null) return null;

        return await storage.GetPresignedUrlAsync(Bucket, file.StorageKey, TimeSpan.FromHours(1));
    }
}

/// <summary>Handles uploading files to a soundfont.</summary>
