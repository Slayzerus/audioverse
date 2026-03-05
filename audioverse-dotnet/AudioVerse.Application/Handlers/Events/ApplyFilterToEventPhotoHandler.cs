using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class ApplyFilterToEventPhotoHandler(IEventRepository repo, IFileStorage storage) : IRequestHandler<ApplyFilterToEventPhotoCommand, ApplyFilterToEventPhotoResult?>
{
    public async Task<ApplyFilterToEventPhotoResult?> Handle(ApplyFilterToEventPhotoCommand req, CancellationToken ct)
    {
        var photo = await repo.GetPhotoByIdAsync(req.PhotoId);
        if (photo == null) return null;

        var stream = await storage.DownloadAsync("ev-photos", photo.ObjectKey);
        if (stream == null) return null;

        byte[] original;
        using (var ms = new MemoryStream())
        {
            await stream.CopyToAsync(ms, ct);
            original = ms.ToArray();
        }

        // Apply filters in sequence
        var processed = original;
        foreach (var filter in req.Filters)
            processed = ImageFilterEngine.Apply(processed, filter, 512);

        // Upload filtered version
        var key = $"events/{photo.EventId}/{Guid.NewGuid()}.png";
        await storage.EnsureBucketExistsAsync("ev-photos", ct);
        using var uploadStream = new MemoryStream(processed);
        await storage.UploadAsync("ev-photos", key, uploadStream, "image/png", ct);

        // Determine the true original (follow the chain)
        var originalId = photo.OriginalId ?? photo.Id;

        // Merge filter history
        var previousFilters = !string.IsNullOrEmpty(photo.FiltersJson)
            ? System.Text.Json.JsonSerializer.Deserialize<string[]>(photo.FiltersJson) ?? []
            : Array.Empty<string>();
        var allFilters = previousFilters.Concat(req.Filters).ToArray();

        var filtered = new EventPhoto
        {
            EventId = photo.EventId,
            ObjectKey = key,
            Caption = photo.Caption,
            UploadedByUserId = req.UserId ?? photo.UploadedByUserId,
            OriginalId = originalId,
            FiltersJson = System.Text.Json.JsonSerializer.Serialize(allFilters)
        };

        var newId = await repo.AddPhotoAsync(filtered);
        return new ApplyFilterToEventPhotoResult(newId, originalId, key, allFilters);
    }
}
